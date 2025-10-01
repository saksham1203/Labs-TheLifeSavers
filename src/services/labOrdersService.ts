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
  };
}

/**
 * Service to interact with Lab Orders API.
 * Provides methods to fetch orders and fetch order details.
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
};
