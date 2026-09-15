'use client';

import { useEffect, type ReactNode } from 'react';
import { AccountProvider } from './account-provider';
import { flushAssignmentActivity, prepareAssignmentTracking } from '../lib/assignment-tracking';
import { useAccount } from './account-provider';

function AssignmentActivityReporter() {
  const { user } = useAccount();
  useEffect(() => {
    prepareAssignmentTracking(user?.id || null);
    const flush = () => void flushAssignmentActivity();
    flush(); window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [user?.id]);
  return null;
}

export default function RootProviders({ children }: { children: ReactNode }) {
  return <AccountProvider><AssignmentActivityReporter />{children}</AccountProvider>;
}
