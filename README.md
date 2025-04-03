# WorkLog

A web application for managing employee requests for extra shifts and vacations. Built with Next.js 14, TypeScript, and Firebase.

[![Deployment Status](https://img.shields.io/badge/deployment-active-green)](https://worklog-git-deploy-fix-yossibuhnik.vercel.app/)

## Deployment

This project is deployed on Vercel. The main deployment branch is `deploy-fix`.

## Features

- Employee request submission for extra shifts and vacations
- Manager approval/rejection workflow
- Multi-language support (English, Hebrew, Arabic)
- Real-time updates with Firebase
- Responsive design with Tailwind CSS

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Firebase (Authentication, Firestore, Storage)
- Tailwind CSS
- Vercel AI SDK

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser