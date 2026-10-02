"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from './api';

export type User = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  systemRole: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    fetchApi('/auth/me')
      .then((userData) => {
        if (userData && userData.username) {
          setUser({
            id: userData.sub,
            username: userData.username,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            systemRole: userData.role,
          });
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    fetchApi('/auth/logout', { method: 'POST' }).finally(() => {
      setUser(null);
      window.location.href = '/login';
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
