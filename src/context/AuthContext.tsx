import React, { createContext, useContext, useState, useEffect } from 'react';
import { MerchantUser } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: MerchantUser | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MerchantUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Purge any old mock data from previous sessions
    localStorage.removeItem('payflow_mock_links');
    localStorage.removeItem('payflow_mode');
    localStorage.removeItem('payflow_mock_processed_events');

    const savedUser = localStorage.getItem('payflow_auth_user');
    const token = localStorage.getItem('payflow_token');

    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        api.setToken(token);
      } catch {
        localStorage.removeItem('payflow_auth_user');
        localStorage.removeItem('payflow_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    const res = await fetch(`${api.getBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: pass }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Invalid email or password');
    }

    const data = await res.json();
    const merchantData: MerchantUser = {
      id: data.user?.id || data.user?._id || 'merchant_id',
      email: data.user?.email || email.trim(),
      name: data.user?.name || email.split('@')[0].toUpperCase() + ' Merchant',
      token: data.token,
    };

    setUser(merchantData);
    api.setToken(data.token);
    localStorage.setItem('payflow_auth_user', JSON.stringify(merchantData));
  };

  const logout = () => {
    setUser(null);
    api.setToken(null);
    localStorage.removeItem('payflow_auth_user');
    localStorage.removeItem('payflow_token');
    localStorage.removeItem('payflow_mock_links');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
