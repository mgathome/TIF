'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';

/**
 * Layout de l'espace restaurant : protège les routes et impose un rôle.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.push('/login?redirect=/dashboard');
    else if (user.role !== 'restaurant' && user.role !== 'admin') router.push('/');
  }, [user, loading, router]);

  if (loading || !user) return <Loading />;

  return <>{children}</>;
}
