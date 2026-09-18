export type UserRole = 'owner' | 'cashier';
export type CashSessionStatus = 'open' | 'closed';
export type SaleStatus = 'completed' | 'voided';

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          ruc: string | null;
          tax_address: string | null;
          phone: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          ruc?: string | null;
          tax_address?: string | null;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          ruc?: string | null;
          tax_address?: string | null;
          phone?: string | null;
          email?: string | null;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          address: string | null;
          district: string | null;
          phone: string | null;
          hours: string | null;
          sanitary_auth: string | null;
          director_name: string | null;
          director_license: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          address?: string | null;
          district?: string | null;
          phone?: string | null;
          hours?: string | null;
          sanitary_auth?: string | null;
          director_name?: string | null;
          director_license?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          address?: string | null;
          district?: string | null;
          phone?: string | null;
          hours?: string | null;
          sanitary_auth?: string | null;
          director_name?: string | null;
          director_license?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          store_id: string | null;
          role: UserRole;
          full_name: string;
          email: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          store_id?: string | null;
          role: UserRole;
          full_name: string;
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          store_id?: string | null;
          email?: string | null;
          is_active?: boolean;
        };
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
          min_stock: number;
          sunat_unit_code: string;
          presentation: string;
          sort_order: number;
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
          min_stock?: number;
          sunat_unit_code?: string;
          presentation?: string;
          sort_order?: number;
        };
        Update: {
          sku?: string | null;
          barcode?: string | null;
          name?: string;
          sale_price?: number;
          is_active?: boolean;
          min_stock?: number;
          sunat_unit_code?: string;
          presentation?: string;
          sort_order?: number;
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
      invoices: {
        Row: {
          id: string;
          organization_id: string;
          store_id: string;
          sale_id: string;
          type: 'boleta' | 'factura';
          series: string;
          number: number;
          customer_name: string | null;
          customer_doc: string | null;
          customer_phone: string | null;
          total: number;
          status: 'issued';
          sunat_status: 'not_sent';
          issued_at: string;
        };
      };
      document_series: {
        Row: {
          id: string;
          organization_id: string;
          store_id: string;
          type: 'boleta' | 'factura';
          series: string;
          next_number: number;
        };
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
      issue_invoice: {
        Args: {
          p_sale_id: string;
          p_type: 'boleta' | 'factura';
          p_customer_name?: string | null;
          p_customer_doc?: string | null;
          p_customer_phone?: string | null;
        };
        Returns: string;
      };
    };
  };
};
