import { BlogPost } from "@/components/blog-page/BlogPost";
import { NavBar } from "@/components/navigation/NavBar";
import { UserContext } from "@/context/UserContext";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";


export default function() {
  const router = useRouter();
  const [id, setId] = useState<number | null>(null);
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
  
        const userData = await response.json();
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

  useEffect(() => {
    if (router.query.blogId && typeof(router.query.blogId) === "string") {
      setId(parseInt(router.query.blogId));
    }
  }, [router.isReady])

  return (
    <>
      <NavBar />
      {router.isReady && id ? <BlogPost id={id}/> : <h1>loading</h1>}
    </>
    
  )
}