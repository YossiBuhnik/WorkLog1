'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUnreadNotifications, markNotificationAsRead } from '../firebase/firebaseUtils';
import { Notification } from '../types';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const notificationsList = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Notification[];
      
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

  useEffect(() => {
    refreshNotifications();
    
    // Set up real-time listener for new notifications
    if (!user?.id) return;
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Notification[];
      
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