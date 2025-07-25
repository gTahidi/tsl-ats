'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Define the shape of our user and context
interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

interface UserContextType {
  user: AuthUser | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
}

// Create the context with a default value
const UserContext = createContext<UserContextType | undefined>(undefined);

// Define the Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
          if (response.status === 401) {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      }
      setLoading(false);
    };

    fetchUser();
  }, [router]);

  const hasPermission = (permission: string) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  return (
    <UserContext.Provider value={{ user, loading, hasPermission }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
