// src/hooks/useLabOrders.ts
import { useEffect, useState, useCallback } from "react";
import { LabOrdersService } from "../services/labOrdersService";

/**
 * React hook to manage fetching lab orders.
 * Provides loading, error, and refresh handling.
 */
export function useLabOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch orders from API and update state
   */
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LabOrdersService.fetchOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load orders on first render
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    loading,
    error,
    reload: loadOrders, // manually trigger reload
  };
}
