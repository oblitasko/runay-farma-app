export type PaymentMethod = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  sort_order: number;
};

export type CartItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export type SalePaymentInput = {
  payment_method_id: string;
  amount: number;
};

export type SaleItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type SalePayment = {
  id: string;
  payment_method_id: string;
  amount: number;
  payment_methods?: { code: string; name: string } | { code: string; name: string }[] | null;
};

export function paymentMethodInfo(payment: SalePayment) {
  const raw = payment.payment_methods;
  const method = Array.isArray(raw) ? raw[0] : raw;
  return {
    code: method?.code ?? 'unknown',
    name: method?.name ?? 'Pago',
  };
}

export type Sale = {
  id: string;
  store_id: string;
  cash_session_id: string;
  cashier_id: string;
  status: string;
  subtotal: number;
  total: number;
  created_at: string;
  sale_items?: SaleItem[];
  sale_payments?: SalePayment[];
};

export type CreateSaleInput = {
  storeId: string;
  cashSessionId: string;
  items: { product_id: string; quantity: number }[];
  payments: SalePaymentInput[];
};
