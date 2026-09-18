export type UserRole = 'owner' | 'cashier';

export type Profile = {
  id: string;
  user_id: string;
  organization_id: string;
  store_id: string | null;
  role: UserRole;
  full_name: string;
  email: string | null;
  is_active: boolean;
};

export type CashierInput = {
  full_name: string;
  email: string;
  password: string;
  store_id: string;
};

export type Store = {
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
};

export type StoreInput = {
  name: string;
  address?: string | null;
  district?: string | null;
  phone?: string | null;
  hours?: string | null;
  sanitary_auth?: string | null;
  director_name?: string | null;
  director_license?: string | null;
};
