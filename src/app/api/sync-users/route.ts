import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase/firebase';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, DocumentData } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

export async function GET() {
  try {
    // Get all users from Firebase Authentication
    const listUsersResult = await adminAuth.listUsers();
    const authUsers = listUsersResult.users;

    // Get all users from Firestore
    const firestoreUsersSnapshot = await adminDb.collection('users').get();
    const firestoreUsers = new Map(
      firestoreUsersSnapshot.docs.map((doc: { id: string; data: () => DocumentData }) => [doc.id, doc.data()])
    );

    const now = Timestamp.now();
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    // Process each auth user
    for (const authUser of authUsers) {
      try {
        const userData = {
          id: authUser.uid,
          email: authUser.email || '',
          name: authUser.displayName || authUser.email?.split('@')[0] || 'Unknown',
          phoneNumber: authUser.phoneNumber || '',
          roles: ['employee'], // Default role
          createdAt: now,
          updatedAt: now,
        };

        if (!firestoreUsers.has(authUser.uid)) {
          // Create new user in Firestore
          await adminDb.collection('users').doc(authUser.uid).set(userData);
          results.created++;
        } else {
          // Update existing user in Firestore
          await adminDb.collection('users').doc(authUser.uid).update({
            ...userData,
            updatedAt: now,
          });
          results.updated++;
        }
      } catch (error) {
        console.error(`Error processing user ${authUser.uid}:`, error);
        results.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Users synchronized successfully',
      results,
    });
  } catch (error) {
    console.error('Error synchronizing users:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error synchronizing users',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 