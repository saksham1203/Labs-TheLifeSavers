// src/services/labOrdersService.ts
import axios from "axios";
import { Preferences } from "@capacitor/preferences";

export let API_BASE = "https://dev-service-thelifesavers-in.onrender.com/api";
// For local testing, you may override at runtime: API_BASE = "http://localhost:5000/api";

/** Auth headers from Capacitor Preferences */
async function getAuthHeaders() {
  const { value: token } = await Preferences.get({ key: "token" });
  if (!token) throw new Error("No token found in storage");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  } as const;
}

export const LabOrdersService = {
  /** Get all lab orders for the logged-in lab */
  async fetchOrders() {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE}/lab-orders`, { headers });
    return res.data.orders;
  },

  /** Get details of a specific order by ID */
  async fetchOrderById(id: string) {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE}/lab-orders/${encodeURIComponent(id)}`, { headers });
    return res.data.order;
  },

  /** Update an order's status */
  async updateStatus(id: string, body: Record<string, any>) {
    const headers = await getAuthHeaders();
    const res = await axios.patch(`${API_BASE}/lab-orders/${encodeURIComponent(id)}/status`, body, {
      headers,
    });
    return res.data;
  },

  /**
   * STEP 1: Ask backend for a pre-signed PUT URL for uploading a report.
   * Body you send MUST match what you will PUT (especially contentType).
   * Response: { success: true, url: string, key: string }
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
   * STEP 2: PUT the file binary directly to the signed URL from STEP 1.
   * - Do not add extra headers (like x-amz-acl) unless your server signed them.
   * - The Content-Type MUST match the one used when presigning.
   */
  async uploadToSignedUrl(url: string, file: Blob | File, contentType: string): Promise<boolean> {
    // Browsers will issue a CORS preflight OPTIONS automatically. Your Spaces CORS rule must allow it.
    const resp = await fetch(url, {
      method: "PUT",
      mode: "cors", // explicit
      // Don't set Content-Length manually; the browser handles it.
      headers: {
        "Content-Type": contentType || "application/octet-stream",
      },
      body: file,
      // helps avoid referrer related mismatches in some strict setups
      referrerPolicy: "no-referrer",
    });

    if (!resp.ok) {
      let extra = "";
      try {
        extra = await resp.text();
      } catch {}
      throw new Error(
        `Upload failed: ${resp.status} ${resp.statusText}${extra ? ` — ${extra}` : ""}`
      );
    }
    return true;
  },
};

/**
 * Helper: Resolve a reliable content-type for a File.
 * Use this value both when requesting the presigned URL AND when doing the PUT.
 */
export function detectContentType(file: File): string {
  // Only allow the types you intend to support
  const fallback = "application/octet-stream";
  if (!file?.type) return fallback;

  // Normalise common pdf/images
  if (file.type === "application/pdf") return "application/pdf";
  if (file.type.startsWith("image/")) return file.type; // e.g. image/png, image/jpeg
  return fallback;
}
