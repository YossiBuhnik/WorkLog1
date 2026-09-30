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

// 'submitted' / 'handled' / 'paid' are used by requests that need no manager approval
// (sick, reserve duty, petty cash - petty cash ends as 'paid')
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'submitted' | 'handled' | 'paid';

export type RequestType = 'vacation' | 'extra_shift' | 'sick' | 'reserve' | 'petty_cash';

export interface Request {
  id: string;
  employeeId: string;
  managerId: string;
  type: RequestType;
  status: RequestStatus;
  startDate: any; // Using 'any' for Firestore Timestamp compatibility
  endDate?: any;
  createdAt: any;
  updatedAt?: any;
  projectName?: string;
  approvedBy?: string | null;
  attachmentCount?: number; // sick / reserve / petty cash: number of attached files (0 = missing document)
  totalAmount?: number; // petty cash: sum of all receipts (ILS)
  description?: string; // petty cash: what the money was spent on
}

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  read?: boolean;
  createdAt?: any;
  relatedRequestId?: string;
  // When set, the text is built from translations at display time (see src/lib/notifications.ts);
  // title/message remain as a fallback for older notifications.
  kind?: 'request_status' | 'request_submitted' | 'report_submitted' | 'request_cancelled';
  params?: Record<string, string>;
}

export interface WorkLog {
  id?: string;
  employeeId: string;
  date: any;
  hours: number;
  task: string;
  createdAt?: any;
} 