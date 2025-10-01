// src/services/labOrdersService.ts
import axios from "axios";
import { Preferences } from "@capacitor/preferences";

const API_BASE = "https://dev-service-thelifesavers-in.onrender.com/api";

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
   * @returns Array of orders
   */
  async fetchOrders() {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE}/lab-orders`, { headers });
    return res.data.orders;
  },

  /**
   * Get details of a specific order by ID.
   * @param id Order ID
   * @returns Single order object
   */
  async fetchOrderById(id: string) {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE}/lab-orders/${id}`, { headers });
    return res.data.order;
  },
};
