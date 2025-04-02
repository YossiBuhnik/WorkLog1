import { Timestamp } from 'firebase/firestore';

export type UserRole = 'employee' | 'manager' | 'office';

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  roles: UserRole[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type RequestType = 'extra_shift' | 'vacation';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Request {
  id: string;
  type: RequestType;
  employeeId: string;
  managerId?: string;
  status: RequestStatus;
  projectName?: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkLog {
  id: string;
  employeeId: string;
  projectName: string;
  date: Timestamp;
  hours: number;
  isExtraShift: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  relatedRequestId?: string;
  createdAt: Timestamp;
} 