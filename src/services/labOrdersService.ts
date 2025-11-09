// src/services/labOrdersService.ts
import axios from "axios";
import { Preferences } from "@capacitor/preferences";

/**
 * API base for your backend (NOT the Spaces URL).
 * You can override this at runtime if needed.
 */
export let API_BASE = "https://dev-service-thelifesavers-in.onrender.com/api";

// Reuse a configured axios instance for your backend calls.
const api = axios.create({
  baseURL: API_BASE,
  timeout: 12000,
});

/** Read the bearer token from Capacitor Preferences and return auth headers. */
async function getAuthHeaders() {
  const { value: token } = await Preferences.get({ key: "token" });
  if (!token) throw new Error("No token found in storage");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  } as const;
}

/** Injects auth headers into a request config. */
async function withAuth() {
  return { headers: await getAuthHeaders() };
}

/** Convert unknown errors into useful messages. */
function toMessage(err: any, fallback = "Request failed") {
  return (
    err?.response?.data?.message ||
    err?.message ||
    (typeof err === "string" ? err : fallback)
  );
}

/**
 * Service to interact with Lab Orders API.
 * - fetch orders & details
 * - update status
 * - upload reports to DO Spaces via presigned URL
 * - (optional) confirm & get signed download URL
 */
export const LabOrdersService = {
  /** Get all lab orders for the logged-in lab. */
  async fetchOrders() {
    const res = await api.get("/lab-orders", await withAuth());
    return res.data?.orders ?? [];
  },

  /** Get a single order by ID. */
  async fetchOrderById(id: string) {
    const res = await api.get(`/lab-orders/${encodeURIComponent(id)}`, await withAuth());
    return res.data?.order ?? null;
  },

  /**
   * Update an order's status (PATCH /lab-orders/:id/status)
   * body example: { status: "SAMPLE_COLLECTED" }
   */
  async updateStatus(id: string, body: Record<string, any>) {
    const res = await api.patch(
      `/lab-orders/${encodeURIComponent(id)}/status`,
      body,
      await withAuth()
    );
    return res.data;
  },

  /**
   * STEP 1: Ask backend for a presigned PUT URL to upload a report file.
   * Endpoint: POST /lab-orders/:id/report/upload-url
   * Body: { contentType, size }
   * Response: { success: true, url, key }
   *
   * NOTE: `contentType` must EXACTLY match what you will send in the PUT.
   */
  async getReportUploadUrl(
    id: string,
    contentType: string,
    size: number
  ): Promise<{ success?: boolean; url: string; key: string }> {
    const res = await api.post(
      `/lab-orders/${encodeURIComponent(id)}/report/upload-url`,
      { contentType, size },
      await withAuth()
    );
    if (!res.data?.url) {
      throw new Error(res.data?.message || "Failed to get upload URL");
    }
    return res.data;
  },

  /**
   * STEP 2: Upload the file BINARY to the signed URL returned from STEP 1.
   *
   * Very important for CORS:
   *  - Send ONLY the Content-Type header that was used to sign the URL
   *  - Do NOT send Authorization/cookies (we set credentials:'omit')
   *  - PUT always triggers a preflight; your DO Spaces CORS must allow:
   *      Origin: https://labs.thelifesavers.in
   *      Methods: PUT (and GET/HEAD for reading)
   *      Headers: content-type (or simply "*")
   */
  async uploadToSignedUrl(
    url: string,
    file: Blob | File,
    contentType: string
  ): Promise<true> {
    let resp: Response | null = null;
    try {
      resp = await fetch(url, {
        method: "PUT",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        headers: {
          // MUST match the one you requested in getReportUploadUrl
          "Content-Type": contentType || "application/octet-stream",
        },
        body: file,
      });
    } catch (e: any) {
      // A network error here often shows as a generic "TypeError: Failed to fetch"
      // when the *preflight* was rejected by CORS.
      throw new Error(
        `Upload request blocked. This usually means a CORS rule problem on your Space (preflight OPTIONS denied).\n` +
          `Details: ${toMessage(e)}`
      );
    }

    if (!resp.ok) {
      let extra = "";
      try {
        extra = await resp.text();
      } catch {}
      // DO Spaces will return 403 when CORS rule didn’t match or signature mismatch.
      if (resp.status === 403) {
        throw new Error(
          `Upload forbidden (403). Check that your Spaces CORS rule ALLOWS your web origin and the header "content-type".` +
            (extra ? `\nServer said: ${extra}` : "")
        );
      }
      throw new Error(
        `Upload failed: ${resp.status} ${resp.statusText}${extra ? ` — ${extra}` : ""}`
      );
    }
    return true;
  },

  /**
   * (Optional) STEP 3: Tell backend the object key is final & can be linked to the order.
   * If your backend exposes it (your controller description mentions a confirmation step).
   * Endpoint: POST /lab-orders/:id/report/confirm  Body: { key }
   */
  async confirmReportUploaded(id: string, key: string) {
    const res = await api.post(
      `/lab-orders/${encodeURIComponent(id)}/report/confirm`,
      { key },
      await withAuth()
    );
    return res.data;
  },

  /**
   * Helper to get a short-lived signed **download** URL for the report
   * GET /lab-orders/:id/report/download-url  -> { success:true, url }
   */
  async getReportDownloadUrl(id: string): Promise<string> {
    const res = await api.get(
      `/lab-orders/${encodeURIComponent(id)}/report/download-url`,
      await withAuth()
    );
    const url = res.data?.url;
    if (!url) throw new Error(res.data?.message || "No download URL returned");
    return url as string;
  },

  /**
   * Convenience: do the full upload flow in one call
   * 1) presign  2) PUT to Spaces  3) confirm (optional)
   */
  async uploadReportFile(orderId: string, file: File) {
    const contentType = file.type || "application/pdf";
    const { url, key } = await this.getReportUploadUrl(orderId, contentType, file.size);
    await this.uploadToSignedUrl(url, file, contentType);
    // If your backend requires confirmation, keep it; otherwise you can remove this call.
    try {
      await this.confirmReportUploaded(orderId, key);
    } catch {
      // Some setups auto-confirm; ignore if endpoint doesn't exist.
    }
    return { key, url };
  },
};
