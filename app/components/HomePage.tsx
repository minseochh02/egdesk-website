'use client';

import { useAuth } from '@/contexts/AuthContext';
import ChatLayout from './ChatLayout';
import EgdeskLandingPage from './landing/EgdeskLandingPage';

function LoadingScreen() {
  return (
    <div className="flex h-screen bg-zinc-900 items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400">Loading...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <ChatLayout />;
  }

  return <EgdeskLandingPage />;
}
