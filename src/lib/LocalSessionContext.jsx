import React, { createContext, useContext, useState } from "react";
import { getLocalUser, localClient } from "@/api/localClient";

const LocalSessionContext = createContext(null);

export function LocalSessionProvider({ children }) {
  const [user, setUser] = useState(getLocalUser);

  const logout = (shouldRedirect = true) => {
    localClient.session.logout();
    setUser(getLocalUser());
    if (shouldRedirect) window.location.assign("/");
  };

  return (
    <LocalSessionContext.Provider value={{ user, logout }}>
      {children}
    </LocalSessionContext.Provider>
  );
}

export function useLocalSession() {
  const context = useContext(LocalSessionContext);
  if (!context) throw new Error("useLocalSession must be used within LocalSessionProvider");
  return context;
}