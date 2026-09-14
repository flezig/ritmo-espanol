'use client';

import type { ReactNode } from 'react';
import { AccountProvider } from './account-provider';

export default function RootProviders({ children }: { children: ReactNode }) {
  return <AccountProvider>{children}</AccountProvider>;
}
