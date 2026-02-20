'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Wraps a page to require authentication.
 * - While the store is rehydrating, shows a centered spinner.
 * - If unauthenticated after rehydration, redirects to /auth/login.
 * - If authenticated, renders children.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // useAuthStore uses zustand/persist — isAuthenticated is set synchronously
  // after the persist middleware rehydrates from localStorage, but in SSR it
  // starts as false.  We rely on useEffect (client-only) to trigger redirect.
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div
            className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin"
            aria-label="Checking authentication..."
          />
          <p className="text-sm text-warm-500">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
