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

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Request {
  id: string;
  employeeId: string;
  employeeName?: string;
  managerId: string;
  type: 'vacation' | 'extra_shift';
  status: RequestStatus;
  startDate: any; // Using 'any' for Firestore Timestamp compatibility
  endDate?: any;
  createdAt: any;
  updatedAt?: any;
  projectName?: string;
  approvedBy?: string | null;
}

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  read?: boolean;
  createdAt?: any;
  relatedRequestId?: string;
}

export interface WorkLog {
  id?: string;
  employeeId: string;
  date: any;
  hours: number;
  task: string;
  createdAt?: any;
} 