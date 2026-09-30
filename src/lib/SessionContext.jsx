import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/api/apiClient";
import { queryClientInstance } from "@/lib/query-client";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api.get("/api/auth/me")
      .then(setUser)
      .catch((error) => setLoadError(error.message))
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (email, password) => {
    const signedIn = await api.post("/api/auth/login", { email, password });
    queryClientInstance.clear();
    setUser(signedIn);
    return signedIn;
  }, []);

  const register = useCallback(async (payload) => {
    const created = await api.post("/api/auth/register", payload);
    queryClientInstance.clear();
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      queryClientInstance.clear();
      setUser(null);
      window.location.assign("/");
    }
  }, []);

  const value = useMemo(() => ({ user, isLoading, loadError, signIn, register, logout }), [user, isLoading, loadError, signIn, register, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within SessionProvider");
  return context;
}
