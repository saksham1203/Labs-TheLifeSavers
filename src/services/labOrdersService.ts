// src/services/labOrdersService.ts
import axios from "axios";
import { Preferences } from "@capacitor/preferences";

/**
 * Prefer env override; fallback to dev API.
 * You can still reassign API_BASE at runtime for local testing.
 */
export let API_BASE =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_API_BASE) ||
  "https://dev-service-thelifesavers-in.onrender.com/api";

/* =========================================================
   Auth header helper
   ========================================================= */
async function getAuthHeaders() {
  const { value: token } = await Preferences.get({ key: "token" });
  if (!token) {
    throw new Error("No token found in storage");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  } as const;
}

/* =========================================================
   Types
   ========================================================= */
export type PresignUploadResponse = {
  success?: boolean;
  url: string; // pre-signed PUT url
  key: string; // object key in bucket (store this on order)
};

export type PresignDownloadResponse = {
  success?: boolean;
  url: string; // pre-signed GET url
};

/* =========================================================
   Service
   ========================================================= */
export const LabOrdersService = {
  /** Get all lab orders for the logged-in lab. */
  async fetchOrders() {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE}/lab-orders`, { headers });
    return res.data.orders;
  },

  /** Get details of a single order. */
  async fetchOrderById(id: string) {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE}/lab-orders/${encodeURIComponent(id)}`, {
      headers,
    });
    return res.data.order;
  },

  /** Update order status. */
  async updateStatus(id: string, body: Record<string, any>) {
    const headers = await getAuthHeaders();
    const res = await axios.patch(
      `${API_BASE}/lab-orders/${encodeURIComponent(id)}/status`,
      body,
      { headers }
    );
    return res.data;
  },

  /**
   * Ask backend for a pre-signed PUT URL for uploading a report file.
   * Body: { contentType, size }
   * Response: { success, url, key }
   */
  async getReportUploadUrl(
    id: string,
    contentType: string,
    size: number
  ): Promise<PresignUploadResponse> {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE}/lab-orders/${encodeURIComponent(id)}/report/upload-url`,
      { contentType, size },
      { headers }
    );
    return res.data as PresignUploadResponse;
  },

  /**
   * Upload the file binary to the given pre-signed PUT url.
   * IMPORTANT:
   *  - Use the EXACT same Content-Type you requested in presign.
   *  - Send no other custom headers to avoid preflight surprises.
   */
  async uploadToSignedUrl(
    url: string,
    file: Blob | File,
    exactContentType: string
  ): Promise<void> {
    const resp = await fetch(url, {
      method: "PUT",
      // Critical: only the required header that was included in the presign
      headers: { "Content-Type": exactContentType || "application/octet-stream" },
      body: file,
      // keep defaults: CORS mode, credentials omitted, etc.
      referrerPolicy: "no-referrer",
    });

    if (!resp.ok) {
      let extra = "";
      try {
        extra = await resp.text();
      } catch {}
      // Browsers show a 'CORS error' on 403 because DO Spaces doesn't include CORS headers on signature failures.
      // 403 is almost always a signature/content-type mismatch.
      if (resp.status === 403) {
        throw new Error(
          `Upload forbidden (403). This usually means the Content-Type didn't match the presign, or the URL expired. ${extra ? "Details: " + extra : ""}`
        );
      }
      throw new Error(
        `Upload failed: ${resp.status} ${resp.statusText}${extra ? ` — ${extra}` : ""}`
      );
    }
  },

  /**
   * Confirm to backend that upload is complete so it can link the report to the order.
   * Endpoint usually: POST /lab-orders/:id/report/confirm  with { key }
   */
  async confirmReportUpload(id: string, key: string) {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE}/lab-orders/${encodeURIComponent(id)}/report/confirm`,
      { key },
      { headers }
    );
    return res.data;
  },

  /**
   * Convenience orchestrator: presign → upload → confirm.
   * Returns the server response of the confirm step.
   */
  async uploadReport(id: string, file: File) {
    const contentType = file.type || "application/pdf";
    const size = file.size;

    // STEP 1: presign with EXACT contentType & size
    const { url, key } = await this.getReportUploadUrl(id, contentType, size);

    // STEP 2: PUT to Spaces with the EXACT same contentType (anything else can 403)
    await this.uploadToSignedUrl(url, file, contentType);

    // STEP 3: tell backend to attach the uploaded object to the order
    return this.confirmReportUpload(id, key);
  },

  /**
   * (Optional) Get a fresh download URL for a report (secure GET).
   * Endpoint: GET /lab-orders/:id/report/download-url
   */
  async getReportDownloadUrl(id: string): Promise<string> {
    const headers = await getAuthHeaders();
    const res = await axios.get<PresignDownloadResponse>(
      `${API_BASE}/lab-orders/${encodeURIComponent(id)}/report/download-url`,
      { headers }
    );
    if (!res.data?.url) {
      throw new Error("No report download URL available");
    }
    return res.data.url;
  },
};

export default LabOrdersService;
