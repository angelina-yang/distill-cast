"use client";

import { useState, useEffect, useCallback } from "react";

export interface UserInfo {
  name: string;
  email: string;
  registeredAt: string;
}

const STORAGE_KEY = "distill-cast-user";

export function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
    setLoaded(true);
  }, []);

  const register = useCallback((name: string, email: string) => {
    const info: UserInfo = {
      name,
      email,
      registeredAt: new Date().toISOString(),
    };
    setUser(info);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  }, []);

  const isRegistered = Boolean(user);

  return { user, isRegistered, loaded, register };
}
