import { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange } from "./authHelpers";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(undefined);
  useEffect(() => {
    onAuthChange((u) => setUser(u));
  }, []);
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};

export const useUser = () => useContext(AuthContext);
