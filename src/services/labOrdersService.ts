// src/services/labOrdersService.ts
import axios from "axios";
import { Preferences } from "@capacitor/preferences";

/**
 * You can override this at runtime in your app bootstrap if needed:
 *   import { API_BASE } from "@/services/labOrdersService";
 *   API_BASE = "http://localhost:5000/api";
 */
export let API_BASE = "https://dev-service-thelifesavers-in.onrender.com/api";

/* -----------------------------------------------------------
   Auth helpers
----------------------------------------------------------- */

async function getAuthHeaders() {
  const { value: token } = await Preferences.get({ key: "token" });
  if (!token) throw new Error("No token found in storage");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  } as const;
}

/* -----------------------------------------------------------
   Network helpers
----------------------------------------------------------- */

function readableUploadError(resp: Response | null, extraBody?: string) {
  if (!resp) return "Upload failed: network error";
  const base = `Upload failed: ${resp.status} ${resp.statusText}`;
  if (extraBody && extraBody.trim().length > 0) return `${base} — ${extraBody}`;
  return base;
}

/**
 * Some browsers label a blocked CORS preflight as a generic "TypeError: Failed to fetch".
 * This helper tries to detect that case from Response/status.
 */
function looksLikeCorsPreflightBlock(resp: Response | null, _err: unknown) {
  // If fetch throws before giving a Response, it's often CORS/preflight/network.
  if (!resp) return true;
  // OPTIONS 403/401 from the Spaces endpoint is almost always a blocked preflight.
  if (resp.status === 401 || resp.status === 403) return true;
  // Safari sometimes gives 0 on blocked requests.
  if (resp.status === 0) return true;
  return false;
}

/* -----------------------------------------------------------
   Lab Orders Service
----------------------------------------------------------- */

export const LabOrdersService = {
  /** Get all lab orders for the logged-in lab. */
  async fetchOrders() {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE}/lab-orders`, { headers });
    return res.data.orders;
  },

  /** Get details of a specific order by ID. */
  async fetchOrderById(id: string) {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE}/lab-orders/${id}`, { headers });
    return res.data.order;
  },

  /** Update an order's status (PATCH /lab-orders/:id/status). */
  async updateStatus(id: string, body: Record<string, any>) {
    const headers = await getAuthHeaders();
    const res = await axios.patch(`${API_BASE}/lab-orders/${id}/status`, body, {
      headers,
    });
    return res.data;
  },

  /**
   * STEP 1:
   * Ask backend for a pre-signed PUT URL for uploading a report file.
   * POST /lab-orders/:id/report/upload-url  { contentType, size }
   * -> { success, url, key }
   */
  async getReportUploadUrl(
    id: string,
    contentType: string,
    size: number
  ): Promise<{ success?: boolean; url: string; key: string }> {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE}/lab-orders/${id}/report/upload-url`,
      { contentType, size },
      { headers }
    );
    return res.data;
  },

  /**
   * STEP 2:
   * Upload the file binary to the signed URL from STEP 1.
   *
   * Why three strategies?
   * - Some signatures expect ONLY Content-Type.
   * - Some signatures are created with ACL in the signing context and require `x-amz-acl: private`.
   * - Some signatures already bake Content-Type and expect no header at all from the browser.
   *
   * We try (1) Content-Type only, then (2) add x-amz-acl: private, then (3) no headers.
   * If all fail, we throw a helpful message (CORS vs signature).
   */
  async uploadToSignedUrl(
    url: string,
    file: Blob | File,
    contentType: string
  ): Promise<true> {
    // Common fetch options
    const baseInit: RequestInit = {
      method: "PUT",
      body: file,
      // Never send any cookies/credentials to Spaces
      credentials: "omit",
      // Make CORS explicit (default) for clarity
      mode: "cors",
      // Avoid referrer leaks
      referrerPolicy: "no-referrer",
      cache: "no-store",
    };

    // Strategy 1: Only Content-Type
    let resp: Response | null = null;
    try {
      resp = await fetch(url, {
        ...baseInit,
        headers: { "Content-Type": contentType || "application/octet-stream" },
      });
      if (resp.ok) return true;
      let text = "";
      try {
        text = await resp.text();
      } catch {}
      // If CORS preflight blocked, we will try next strategy but keep context.
      if (looksLikeCorsPreflightBlock(resp, null) === false) {
        throw new Error(readableUploadError(resp, text));
      }
    } catch (err1: any) {
      // continue to Strategy 2
    }

    // Strategy 2: Content-Type + x-amz-acl: private (common with server-side ACL signing)
    resp = null;
    try {
      resp = await fetch(url, {
        ...baseInit,
        headers: {
          "Content-Type": contentType || "application/octet-stream",
          "x-amz-acl": "private",
        },
      });
      if (resp.ok) return true;

      let text = "";
      try {
        text = await resp.text();
      } catch {}
      if (looksLikeCorsPreflightBlock(resp, null) === false) {
        throw new Error(readableUploadError(resp, text));
      }
    } catch (err2: any) {
      // continue to Strategy 3
    }

    // Strategy 3: No headers at all (only works if the presign already fixes CT/ACL in the signature)
    resp = null;
    try {
      resp = await fetch(url, { ...baseInit });
      if (resp.ok) return true;

      let text = "";
      try {
        text = await resp.text();
      } catch {}

      // If we reached here, all three attempts failed
      if (looksLikeCorsPreflightBlock(resp, null)) {
        throw new Error(
          "Upload failed: Upload request blocked. This usually means a CORS rule problem on your Space (preflight OPTIONS denied)."
        );
      }
      throw new Error(readableUploadError(resp, text));
    } catch (err3: any) {
      // Final fallback message with guidance
      const message =
        typeof err3?.message === "string" && err3.message
          ? err3.message
          : "Upload failed (network or CORS).";

      // Give a more actionable hint if it's likely CORS/preflight
      if (!resp || looksLikeCorsPreflightBlock(resp, err3)) {
        throw new Error(
          `${message}\n\nChecklist:\n• In your DO Space CORS rules, allow your web origin (e.g. https://labs.thelifesavers.in)\n• Methods: PUT, GET, HEAD, DELETE, POST\n• Allowed Headers: *  (or at least: content-type,x-amz-acl)\n• Max Age: large (e.g. 86400)\n• If your server signs with x-amz-acl, the browser must send that header.\n• Ensure the Content-Type used to create the presigned URL exactly matches the one sent by the browser.`
        );
      }

      throw new Error(message);
    }
  },
};
