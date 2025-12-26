import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type AdminProfile = {
  email: string;
  role: "admin";
  name?: string | null;
};

type AdminAuthContextType = {
  admin: AdminProfile | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const STORAGE_KEY = "adminToken";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:5000/api";

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
};

export const AdminAuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = !!token && !!admin;

  const refresh = async () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setToken(null);
      setAdmin(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/me`, {
        headers: {
          Authorization: `Bearer ${stored}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setAdmin(null);
      } else {
        setToken(stored);
        setAdmin(data.data.admin);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      return { success: false, message: data?.message || "Login failed" };
    }

    localStorage.setItem(STORAGE_KEY, data.data.token);
    setToken(data.data.token);
    setAdmin(data.data.admin);

    return { success: true, message: data.message || "Admin login successful" };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setAdmin(null);
  };

  const value = useMemo<AdminAuthContextType>(
    () => ({
      admin,
      token,
      isLoading,
      isAdmin,
      login,
      logout,
      refresh,
    }),
    [admin, token, isLoading, isAdmin]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
