'use client';

import React, { createContext, useContext, useState } from 'react';
import LogoutModal from '@/components/dashboard/LogoutModal';
import { useRouter } from 'next/navigation';

interface LogoutContextType {
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
}

const LogoutContext = createContext<LogoutContextType | undefined>(undefined);

export function LogoutProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const openLogoutModal = () => setIsOpen(true);
  const closeLogoutModal = () => setIsOpen(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setIsOpen(false);
    router.push('/signin');
    router.refresh(); // Ensure the middleware re-evaluates the session
  };

  return (
    <LogoutContext.Provider value={{ openLogoutModal, closeLogoutModal }}>
      {children}
      <LogoutModal 
        isOpen={isOpen} 
        onClose={closeLogoutModal} 
        onConfirm={handleLogout} 
      />
    </LogoutContext.Provider>
  );
}

export function useLogout() {
  const context = useContext(LogoutContext);
  if (context === undefined) {
    throw new Error('useLogout must be used within a LogoutProvider');
  }
  return context;
}
