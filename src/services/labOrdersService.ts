// src/services/labOrdersService.ts
import axios from "axios";
import { Preferences } from "@capacitor/preferences";

export let API_BASE = "https://dev-service-thelifesavers-in.onrender.com/api";
// For local testing you can override at runtime:
//   import { LabOrdersService, API_BASE } from "...";  API_BASE = "http://localhost:5000/api";

/* -------------------------------------------------------
   Auth header helper (Capacitor Preferences -> bearer)
------------------------------------------------------- */
async function getAuthHeaders() {
  const { value: token } = await Preferences.get({ key: "token" });
  if (!token) throw new Error("No token found in storage");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  } as const;
}

/* -------------------------------------------------------
   Upload helper: PUT to presigned URL with minimal headers
   - Sends only Content-Type that backend signed with
   - Tries fetch first; on CORS TypeError retries with axios
   - Accepts opaque success (some CDNs)
------------------------------------------------------- */
async function putToPresignedUrl(
  url: string,
  file: Blob | File,
  contentType: string
): Promise<void> {
  // 1) Try with fetch (no credentials, only Content-Type)
  try {
    const resp = await fetch(url, {
      method: "PUT",
      mode: "cors",
      cache: "no-store",
      headers: { "Content-Type": contentType || "application/octet-stream" },
      body: file,
    });

    // Some CDNs return opaque responses for successful CORS PUTs.
    // Treat that as success if status is not visible.
    if (resp.type === "opaque") return;

    if (!resp.ok) {
      const text = await safeReadText(resp);
      throw httpError(
        `Upload failed: ${resp.status} ${resp.statusText}${text ? ` — ${text}` : ""}`,
        resp.status
      );
    }
    return;
  } catch (err: any) {
    // If browser throws a TypeError (often shown as “CORS error”), try axios
    const isLikelyCors = err instanceof TypeError || /NetworkError|Failed to fetch|CORS/i.test(String(err?.message));
    if (!isLikelyCors) throw err;
  }

  // 2) Retry with axios.put, but ensure we don't send any extra headers
  try {
    await axios.put(url, file, {
      headers: { "Content-Type": contentType || "application/octet-stream" },
      // prevent axios from auto-injecting defaults that would break the signature
      transformRequest: [(data, headers) => {
        // scrub common axios header sets that might sneak in
        if (headers) {
          delete (headers as any).common;
          delete (headers as any).put;
          delete (headers as any).post;
          delete (headers as any).get;
          // we keep only Content-Type
          for (const k of Object.keys(headers)) {
            if (k.toLowerCase() !== "content-type") delete (headers as any)[k];
          }
        }
        return data;
      }],
      maxBodyLength: Infinity,
      // never send cookies to DO Spaces; presigned URL uses query auth
      withCredentials: false,
      validateStatus: (s) => (s >= 200 && s < 300) || s === 204,
    });
  } catch (err: any) {
    const status = err?.response?.status;
    const body = err?.response?.data
      ? typeof err.response.data === "string"
        ? err.response.data
        : JSON.stringify(err.response.data)
      : "";
    if (status === 403) {
      throw httpError(
        "Upload rejected (403). Check that the Content-Type you send EXACTLY matches the one used to create the presigned URL, and that your Space CORS allows your production origin and PUT.",
        403
      );
    }
    throw httpError(
      `Upload failed${status ? ` (${status})` : ""}${body ? ` — ${body}` : ""}`,
      status
    );
  }
}

function httpError(message: string, status?: number) {
  const e = new Error(message) as Error & { status?: number };
  e.status = status;
  return e;
}

async function safeReadText(resp: Response) {
  try {
    return await resp.text();
  } catch {
    return "";
  }
}

/* -------------------------------------------------------
   Lab Orders Service
------------------------------------------------------- */
export const LabOrdersService = {
  /** List lab orders for the logged-in lab */
  async fetchOrders() {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE}/lab-orders`, { headers });
    return res.data.orders;
  },

  /** Get single order by id */
  async fetchOrderById(id: string) {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE}/lab-orders/${encodeURIComponent(id)}`, { headers });
    return res.data.order;
  },

  /** Update order status */
  async updateStatus(id: string, body: Record<string, any>) {
    const headers = await getAuthHeaders();
    const res = await axios.patch(
      `${API_BASE}/lab-orders/${encodeURIComponent(id)}/status`,
      body,
      { headers }
    );
    return res.data;
  },

  /* ---------------- Reports: UPLOAD ---------------- */

  /**
   * STEP 1: ask backend for a presigned PUT URL
   * POST /lab-orders/:id/report/upload-url
   * body: { contentType, size }
   * returns: { success, url, key }
   */
  async getReportUploadUrl(
    id: string,
    contentType: string,
    size: number
  ): Promise<{ success?: boolean; url: string; key: string }> {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE}/lab-orders/${encodeURIComponent(id)}/report/upload-url`,
      { contentType, size },
      { headers }
    );
    return res.data;
  },

  /**
   * STEP 2: PUT the binary to the presigned URL (DO Spaces)
   * Sends only Content-Type (must match what the backend signed)
   */
  async uploadToSignedUrl(
    url: string,
    file: Blob | File,
    contentType: string
  ): Promise<boolean> {
    await putToPresignedUrl(url, file, contentType);
    return true;
  },

  /* ---------------- Reports: DOWNLOAD ---------------- */

  /**
   * Get a fresh presigned GET URL for report viewing/downloading.
   * GET /lab-orders/:id/report/download-url
   * returns: { success: true, url: "https://...signed..." }
   */
  async getReportDownloadUrl(id: string): Promise<string> {
    const headers = await getAuthHeaders();
    const res = await axios.get(
      `${API_BASE}/lab-orders/${encodeURIComponent(id)}/report/download-url`,
      { headers, params: { _: Date.now() } } // small cache-buster
    );
    if (!res.data?.success || !res.data?.url) {
      throw new Error(res.data?.message || "Report link not available yet");
    }
    return res.data.url as string;
  },
};
