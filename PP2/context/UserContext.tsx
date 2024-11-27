import React, { createContext, useState, ReactNode, useEffect } from "react";
import { UserPayload } from "@/new-types";

interface UserContextType {
  user: UserPayload | null;
  login: (userData: UserPayload) => void;
  logout: () => void;
  loading: boolean
}

export const UserContext = createContext<UserContextType>({
  user: null,
  login() {},
  logout() {},
  loading: true
});

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<UserPayload | null>({
    id: 0,
    userType: "ADMIN",
    email: "john@scriptorium.com",
    firstName: "John",
    lastName: "Doe",
  });
  const [loading, setLoading] = useState(true);
  
  const login = (userData: UserPayload) => {
    setUser(userData);
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
  };
  
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
        fetchUserData(accessToken);
    } else {
        setLoading(false);
    }
  }, []);
  
  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const userData: UserPayload = await response.json();
      setUser(userData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout, loading }}>
      { children }
    </UserContext.Provider>
  );
};
