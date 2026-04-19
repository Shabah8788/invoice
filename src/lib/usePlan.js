import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export const FREE_INVOICE_LIMIT = 5;
export const FREE_CUSTOMER_LIMIT = 10;

export function usePlan() {
  const [user, setUser] = useState(null);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, invoices, customers] = await Promise.all([
        base44.auth.me(),
        base44.entities.Invoice.list("-created_date", 200),
        base44.entities.Customer.list("-created_date", 200),
      ]);
      setUser(u);
      setInvoiceCount(invoices.length);
      setCustomerCount(customers.length);
      setLoading(false);
    }
    load();
  }, []);

  const isPro = user?.subscription === "pro";

  return {
    isPro,
    loading,
    invoiceCount,
    customerCount,
    canCreateInvoice: isPro || invoiceCount < FREE_INVOICE_LIMIT,
    canCreateCustomer: isPro || customerCount < FREE_CUSTOMER_LIMIT,
    invoicesLeft: isPro ? Infinity : Math.max(0, FREE_INVOICE_LIMIT - invoiceCount),
    customersLeft: isPro ? Infinity : Math.max(0, FREE_CUSTOMER_LIMIT - customerCount),
  };
}