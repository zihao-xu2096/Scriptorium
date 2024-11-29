
import Dashboard from "@/components/home/Dashboard";
import localFont from "next/font/local";
import { useContext, useEffect } from "react";
import { UserContext } from "@/context/UserContext";
import { LandingPage } from "@/components/home/Landing";
import { RichTextEditor } from "@/components/editor/Editor";
import { Footer } from "@/components/navigation/Footer";
import { NavBar } from "@/components/navigation/NavBar";
import { useRouter } from "next/router";
import { UserPayload } from "@/new-types";

export default function Home() {
  const { user, loading, login } = useContext(UserContext);

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
              return;
            } else {
              localStorage.setItem('accessToken', newToken);
              response = await fetch('/api/profile', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                },
              });
            }
          } else {
            return;
          }
        }
  
        const userData: UserPayload = await response.json();
        login(userData);
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
    } 
  }, [])

  return (
    loading ? <h1>Loading...</h1> :
    <>
      <NavBar />
      {user ? <Dashboard /> : <LandingPage />}
      <Footer />
    </>
  );
}