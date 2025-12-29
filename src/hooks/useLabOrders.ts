// src/hooks/useLabOrders.ts
import { useEffect, useState, useCallback } from "react";
import { LabOrdersService } from "../services/labOrdersService";

/**
 * React hook to manage fetching lab orders.
 * Provides loading, error, refresh and updateStatus handling.
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
      setOrders(
        (data ?? []).map((o: any) => ({
          ...o,
          publicId: o.orderId ?? o.id, // 👈 ADD THIS
        }))
      );
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

  /**
   * Update order status on server.
   * Performs optimistic update of local `orders`. Rolls back on error.
   *
   * @param id Order id
   * @param body e.g. { status: "SAMPLE_COLLECTED" }
   * @returns server response (res.data) or throws
   */
  const updateOrderStatus = useCallback(
    async (id: string, body: Record<string, any>) => {
      // snapshot for rollback
      let prevSnapshot: any[] = [];
      setOrders((prev) => {
        prevSnapshot = prev;
        // optimistic status change if provided
        if (body.status) {
          return prev.map((o) => (o.id === id ? { ...o, status: body.status } : o));
        }
        return prev;
      });

      try {
        const res = await LabOrdersService.updateStatus(id, body);
        // replace the raw server order for the corresponding id
        const serverOrder = res.order;
        setOrders((prev) => prev.map((o) => (o.id === serverOrder.id ? { ...o, ...serverOrder } : o)));
        return res;
      } catch (err: any) {
        // rollback
        setOrders(prevSnapshot);
        setError(err?.message ?? "Failed to update order status");
        throw err;
      }
    },
    []
  );

  const updatePaymentStatus = useCallback(
  async (id: string, paymentStatus: "Paid" | "Refunded" | "Pending") => {
    let prevSnapshot: any[] = [];

    setOrders((prev) => {
      prevSnapshot = prev;
      return prev.map((o) =>
        o.id === id
          ? {
              ...o,
              payment: { ...o.payment, status: paymentStatus },
            }
          : o
      );
    });

    try {
      const res = await LabOrdersService.updatePaymentStatus(
        id,
        paymentStatus.toUpperCase() as any // "PAID"
      );

      const serverOrder = res.order;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === serverOrder.id ? { ...o, ...serverOrder } : o
        )
      );

      return res;
    } catch (err: any) {
      setOrders(prevSnapshot);
      setError(err?.message ?? "Failed to update payment");
      throw err;
    }
  },
  []
);


  return {
    orders,
    loading,
    error,
    reload: loadOrders, // manually trigger reload
    updateOrderStatus,
    updatePaymentStatus,
  };
}
