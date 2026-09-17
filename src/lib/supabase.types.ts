export type UserRole = 'owner' | 'cashier';
export type CashSessionStatus = 'open' | 'closed';
export type SaleStatus = 'completed' | 'voided';

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: { name?: string };
        Relationships: [];
      };
      stores: {
        Row: { id: string; organization_id: string; name: string; created_at: string };
        Insert: { id?: string; organization_id: string; name: string; created_at?: string };
        Update: { name?: string };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          store_id: string | null;
          role: UserRole;
          full_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          store_id?: string | null;
          role: UserRole;
          full_name: string;
          created_at?: string;
        };
        Update: { full_name?: string; role?: UserRole; store_id?: string | null };
      };
      products: {
        Row: {
          id: string;
          organization_id: string;
          sku: string | null;
          barcode: string | null;
          name: string;
          sale_price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          sku?: string | null;
          barcode?: string | null;
          name: string;
          sale_price: number;
          is_active?: boolean;
        };
        Update: {
          sku?: string | null;
          barcode?: string | null;
          name?: string;
          sale_price?: number;
          is_active?: boolean;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          organization_id: string;
          code: string;
          name: string;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          organization_id: string;
          code: string;
          name: string;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: { name?: string; is_active?: boolean; sort_order?: number };
      };
      cash_sessions: {
        Row: {
          id: string;
          organization_id: string;
          store_id: string;
          opened_by: string;
          closed_by: string | null;
          status: CashSessionStatus;
          opening_amount: number;
          closing_amount: number | null;
          expected_cash: number | null;
          difference: number | null;
          notes: string | null;
          opened_at: string;
          closed_at: string | null;
        };
        Insert: {
          organization_id: string;
          store_id: string;
          opened_by: string;
          status?: CashSessionStatus;
          opening_amount?: number;
        };
        Update: {
          closed_by?: string | null;
          status?: CashSessionStatus;
          closing_amount?: number | null;
          expected_cash?: number | null;
          difference?: number | null;
          notes?: string | null;
          closed_at?: string | null;
        };
      };
      sales: {
        Row: {
          id: string;
          organization_id: string;
          store_id: string;
          cash_session_id: string;
          cashier_id: string;
          status: SaleStatus;
          subtotal: number;
          total: number;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          store_id: string;
          cash_session_id: string;
          cashier_id: string;
          status?: SaleStatus;
          subtotal: number;
          total: number;
        };
        Update: { status?: SaleStatus };
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Insert: {
          sale_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Update: Record<string, never>;
      };
      sale_payments: {
        Row: {
          id: string;
          sale_id: string;
          payment_method_id: string;
          amount: number;
        };
        Insert: { sale_id: string; payment_method_id: string; amount: number };
        Update: Record<string, never>;
      };
    };
    Functions: {
      create_sale: {
        Args: {
          p_store_id: string;
          p_cash_session_id: string;
          p_items: unknown;
          p_payments: unknown;
        };
        Returns: string;
      };
      close_cash_session: {
        Args: { p_session_id: string; p_counted_amount: number; p_notes?: string | null };
        Returns: Database['public']['Tables']['cash_sessions']['Row'];
      };
    };
  };
};
