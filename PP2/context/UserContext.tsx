import React, { createContext, useState, ReactNode, useEffect } from "react";
import { UserPayload } from "@/new-types";
import { useRouter } from "next/router";

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

export async function attemptRefresh() {
  const fetchUserData = async (token: string) => {
    try {
      let response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return null;
      }

      console.log(response)
      const userData = await response.json();
      console.log(userData);
      return userData;
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRefreshToken = async (token: string) => {
    try {
      const response = await fetch('/api/refresh', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return null;
      }

      const accessToken = await response.json();
      return accessToken.accessToken;
    } catch (error) {
      console.error(error);
    } 
  };

  const refreshToken = localStorage.getItem('refreshToken');
  
  if (refreshToken) {
    const accessToken = await fetchRefreshToken(refreshToken);
    if (!accessToken) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    }
    localStorage.setItem("accessToken", accessToken);
    return await fetchUserData(accessToken);
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return null;
  }
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const login = (userData: UserPayload) => {
    setUser(userData);
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };
  
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    const fetchUserData = async (token: string) => {
      try {
        let response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          if (refreshToken) {
            const newToken = await fetchRefreshToken(refreshToken);
            if (!newToken) {
              logout();
              return;
            } else {
              localStorage.setItem('accessToken', newToken);
              response = await fetch('/api/profile', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                },
              });
              if (!response.ok) {
                logout();
              }
            }
          } else {
            logout();
            return;
          }
        }
  
        const userData: UserPayload = await response.json();
        setUser(userData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRefreshToken = async (token: string) => {
      try {
        const response = await fetch('/api/refresh', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          return null;
        }
  

        const accessToken = await response.json();
        return accessToken.accessToken;
      } catch (error) {
        console.error(error);
      } 
    };

    if (accessToken) {
        fetchUserData(accessToken);
    } else {
        logout();
        setLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout, loading }}>
      { children }
    </UserContext.Provider>
  );
};
