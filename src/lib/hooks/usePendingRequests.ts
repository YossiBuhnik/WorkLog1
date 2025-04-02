import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Request } from '../types';

export const usePendingRequests = (managerId: string | undefined) => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!managerId) {
      setPendingCount(0);
      return;
    }

    // Create a query for pending requests for this manager
    const q = query(
      collection(db, 'requests'),
      where('managerId', '==', managerId),
      where('status', '==', 'pending')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.docs.length);
    }, (error) => {
      console.error('Error fetching pending requests:', error);
      setPendingCount(0);
    });

    // Clean up subscription
    return () => unsubscribe();
  }, [managerId]);

  return pendingCount;
}; 