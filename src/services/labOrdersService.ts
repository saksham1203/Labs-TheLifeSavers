// src/services/labOrdersService.ts
import axios from "axios";
import { Preferences } from "@capacitor/preferences";

export let API_BASE = "https://dev-service-thelifesavers-in.onrender.com/api";
// For local testing you can override this at runtime:
// import { LabOrdersService, API_BASE } and set API_BASE = "http://localhost:5000/api";

/**
 * Helper to get auth headers from Capacitor Preferences.
 * It looks for the `token` key stored in local storage.
 */
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

/**
 * Service to interact with Lab Orders API.
 * Provides methods to fetch orders, fetch order details,
 * update status, and upload reports to DO Spaces via a pre-signed URL.
 */
export const LabOrdersService = {
  /**
   * Get all lab orders for the logged-in lab.
   * @returns Array of orders (raw server objects)
   */
  async fetchOrders() {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE}/lab-orders`, { headers });
    return res.data.orders;
  },

  /**
   * Get details of a specific order by ID.
   * @param id Order ID
   * @returns Single order object (raw server object)
   */
  async fetchOrderById(id: string) {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE}/lab-orders/${id}`, { headers });
    return res.data.order;
  },

  /**
   * Update an order's status (PATCH /lab-orders/:id/status)
   * @param id Order ID
   * @param body Request body, e.g. { status: "SAMPLE_COLLECTED" }
   * @returns server response: { success: true, order: { ... } }
   */
  async updateStatus(id: string, body: Record<string, any>) {
    const headers = await getAuthHeaders();
    const res = await axios.patch(
      `${API_BASE}/lab-orders/${id}/status`,
      body,
      { headers }
    );
    return res.data;
  },

  /**
   * STEP 1: Ask backend for a pre-signed PUT URL for uploading a report file.
   * Endpoint: POST /lab-orders/:id/report/upload-url
   * Body: { contentType: string, size: number }
   * Response: { success: true, url: string, key: string }
   *
   * @param id order id (⚠️ the LabOrder id)
   * @param contentType e.g. "application/pdf"
   * @param size file size in bytes
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
   * STEP 2: Upload the file binary to the signed URL returned from STEP 1.
   * Use fetch for direct PUT; pass the same Content-Type you requested.
   *
   * @returns true on 2xx; throws on non-2xx with a readable error.
   */
  async uploadToSignedUrl(
    url: string,
    file: Blob | File,
    contentType: string
  ): Promise<boolean> {
    const resp = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": contentType || "application/octet-stream",
      },
      body: file,
    });

    if (!resp.ok) {
      let extra = "";
      try {
        extra = await resp.text();
      } catch {}
      throw new Error(
        `Upload failed: ${resp.status} ${resp.statusText}${
          extra ? ` — ${extra}` : ""
        }`
      );
    }
    return true;
  },
};
