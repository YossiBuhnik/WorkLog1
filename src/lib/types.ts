export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  roles: string[];
  status?: 'active' | 'inactive';
  department?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'employee' | 'manager' | 'office'; 