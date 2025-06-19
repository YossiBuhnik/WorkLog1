import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { User, Request, WorkLog, Notification, UserRole, RequestStatus } from '../types';

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    return userCredential.user;
  } catch (error) {
    console.error("Error signing up with email", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in with email", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// User Management
export const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { currentUser } = auth;
  if (!currentUser) throw new Error('No authenticated user');
  
  const userRef = doc(db, 'users', currentUser.uid);
  const now = Timestamp.now();
  
  await setDoc(userRef, {
    ...userData,
    id: currentUser.uid,
    createdAt: now,
    updatedAt: now,
  });
  
  return currentUser.uid;
};

export const getUser = async (userId: string) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.exists() ? userDoc.data() as User : null;
};

export const updateUser = async (userId: string, userData: Partial<User>) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...userData,
    updatedAt: Timestamp.now(),
  });
};

// Request Management
export const createRequest = async (requestData: Omit<Request, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  // Validate required fields
  if (!requestData.employeeId) {
    throw new Error('employeeId is required');
  }
  if (!requestData.type) {
    throw new Error('type is required');
  }
  if (!requestData.startDate) {
    throw new Error('startDate is required');
  }
  if (!requestData.managerId) {
    throw new Error('managerId is required');
  }

  // Validate that startDate is a Timestamp
  if (!(requestData.startDate instanceof Timestamp)) {
    throw new Error('startDate must be a Firestore Timestamp');
  }

  // Validate endDate if provided
  if (requestData.endDate && !(requestData.endDate instanceof Timestamp)) {
    throw new Error('endDate must be a Firestore Timestamp');
  }

  try {
    const requestRef = doc(collection(db, 'requests'));
    const now = Timestamp.now();
    
    const requestToSave = {
      ...requestData,
      id: requestRef.id,
      status: 'pending' as RequestStatus,
      createdAt: now,
      updatedAt: now,
    };

    console.log('Saving request:', requestToSave);
    
    await setDoc(requestRef, requestToSave);
    
    return requestRef.id;
  } catch (error) {
    console.error('Error in createRequest:', error);
    throw error;
  }
};

/**
 * Updates the status of a request.
 * @param {string} requestId - The ID of the request to update.
 * @param {RequestStatus} status - The new status ('approved' or 'rejected').
 * @param {string} [approvedBy] - The name of the user who approved the request.
 */
export const updateRequestStatus = async (requestId: string, status: RequestStatus, approvedBy?: string) => {
  const requestRef = doc(db, 'requests', requestId);
  const dataToUpdate: any = {
    status,
    updatedAt: Timestamp.now(),
  };

  if (status === 'approved' && approvedBy) {
    dataToUpdate.approvedBy = approvedBy;
  }
  
  await updateDoc(requestRef, dataToUpdate);
};

export const getRequestsByEmployee = async (employeeId: string) => {
  const q = query(
    collection(db, 'requests'),
    where('employeeId', '==', employeeId)
  );
  
  const querySnapshot = await getDocs(q);
  const requests = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  })) as Request[];
  
  // Sort in memory using Timestamp seconds
  return requests.sort((a, b) => 
    b.createdAt.seconds - a.createdAt.seconds
  );
};

export const getRequestsByManager = async () => {
  const q = query(
    collection(db, 'requests'),
    where('status', '==', 'pending')
  );
  const querySnapshot = await getDocs(q);
  const requests = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  })) as Request[];
  // Sort in memory using Timestamp seconds
  return requests.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
};

// Work Log Management
export const createWorkLog = async (workLogData: Omit<WorkLog, 'id' | 'createdAt' | 'updatedAt'>) => {
  const workLogRef = doc(collection(db, 'workLogs'));
  const now = Timestamp.now();
  
  await setDoc(workLogRef, {
    ...workLogData,
    id: workLogRef.id,
    createdAt: now,
    updatedAt: now,
  });
  
  return workLogRef.id;
};

export const getWorkLogsByMonth = async (year: number, month: number) => {
  const startDate = Timestamp.fromDate(new Date(year, month, 1));
  const endDate = Timestamp.fromDate(new Date(year, month + 1, 0));
  
  const q = query(
    collection(db, 'workLogs'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as WorkLog);
};

// Notification Management
export const createNotification = async (notificationData: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
  const notificationRef = doc(collection(db, 'notifications'));
  const now = Timestamp.now();
  
  await setDoc(notificationRef, {
    ...notificationData,
    id: notificationRef.id,
    read: false,
    createdAt: now,
  });
  
  return notificationRef.id;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    read: true,
  });
};

export const getUnreadNotifications = async (userId: string) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );
  
  const querySnapshot = await getDocs(q);
  const notifications = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  })) as Notification[];
  
  // Filter and sort in memory instead of using where and orderBy
  return notifications
    .filter(notification => !notification.read)
    .sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

export const cancelRequest = async (requestId: string) => {
  const requestRef = doc(db, 'requests', requestId);
  const requestDoc = await getDoc(requestRef);
  
  if (!requestDoc.exists()) {
    throw new Error('Request not found');
  }

  const request = requestDoc.data() as Request;
  const now = Timestamp.now();
  const startDate = request.startDate;

  // Only allow cancellation if the start date hasn't passed
  if (startDate.seconds < now.seconds) {
    throw new Error('Cannot cancel a request that has already started');
  }

  await updateDoc(requestRef, {
    status: 'cancelled',
    updatedAt: now,
  });

  // If the request was approved, create a notification for the manager
  if (request.status === 'approved' && request.managerId) {
    await createNotification({
      userId: request.managerId,
      title: 'Request Cancelled',
      message: `A ${request.type} request has been cancelled by the employee`,
      relatedRequestId: requestId
    });
  }
};
