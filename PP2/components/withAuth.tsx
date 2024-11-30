import { UserContext } from "@/context/UserContext";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";

const withAuth = (WrappedComponent: React.ComponentType) => {
  return (props: any) => {
    const { user, loading, login } = useContext(UserContext);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const accessToken = localStorage.getItem("accessToken");

      const fetchUserData = async (token: string) => {
        try {
          const response = await fetch("/api/profile", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }

          const userData = await response.json();
          if (JSON.stringify(user) !== JSON.stringify(userData)) {
            login(userData);
          }
        } catch (error) {
          console.error(error);
          router.push("/login");
        } finally {
          setIsLoading(false);
        }
      };

      if (accessToken) {
        fetchUserData(accessToken);
      } else {
        setIsLoading(false);
      }
    }, [login, router, user]);

    if (isLoading || loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <p>Loading...</p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;