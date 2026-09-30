'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUnreadNotifications, markNotificationAsRead } from '../firebase/firebaseUtils';
import { Notification } from '../types';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const sortNewestFirst = (list: Notification[]) =>
  list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const notificationsRef = collection(db, 'notifications');
      // No orderBy here: userId + orderBy(createdAt) would need a composite index in Firestore.
      // Sorting is done in memory instead.
      const q = query(notificationsRef, where('userId', '==', user.id));
      
      const querySnapshot = await getDocs(q);
      const notificationsList = sortNewestFirst(querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Notification[]);
      
      setNotifications(notificationsList);
      const unreadCount = notificationsList.filter(n => !n.read).length;
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    await refreshNotifications();
  };

  const markAllAsRead = async () => {
    await Promise.all(notifications.filter(n => !n.read && n.id).map(n => markNotificationAsRead(n.id as string)));
    await refreshNotifications();
  };

  useEffect(() => {
    refreshNotifications();
    
    // Set up real-time listener for new notifications
    if (!user?.id) return;
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', user.id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = sortNewestFirst(snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Notification[]);
      
      setNotifications(notificationsList);
      const unreadCount = notificationsList.filter(n => !n.read).length;
      setUnreadCount(unreadCount);
    });
    
    return () => unsubscribe();
  }, [user, refreshNotifications]);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 