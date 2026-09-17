export type UserRole = 'owner' | 'cashier';

export type Profile = {
  id: string;
  user_id: string;
  organization_id: string;
  store_id: string | null;
  role: UserRole;
  full_name: string;
};

export type Store = {
  id: string;
  organization_id: string;
  name: string;
};
