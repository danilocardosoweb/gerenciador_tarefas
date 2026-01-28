import { useState, useEffect } from "react";
import { Order } from "@/types/order";

const STORAGE_KEY = "routemaster_orders";

function getInitialOrders(): Order[] {
  if (typeof window !== "undefined") {
    const storedOrders = localStorage.getItem(STORAGE_KEY);
    if (storedOrders) {
      try {
        // Adicionamos uma verificação para garantir que o que está no storage é um array
        const parsed = JSON.parse(storedOrders);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Failed to parse orders from localStorage:", e);
        return [];
      }
    }
  }
  return [];
}

export function useOrderPersistence() {
  const [orders, setOrders] = useState<Order[]>(getInitialOrders);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error("Failed to save orders to localStorage:", error);
    }
  }, [orders]);

  const setPersistedOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
  };

  const clearPersistedOrders = () => {
    setOrders([]);
  };

  return {
    orders,
    setPersistedOrders,
    clearPersistedOrders,
  };
}