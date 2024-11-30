import { UserContext } from "@/context/UserContext";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";


export function NavBar() {
  const router = useRouter();
  const { user, loading, login, logout } = useContext(UserContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!accessToken || !refreshToken) {
      logout();
      return;
    }

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
              localStorage.removeItem("refreshToken")
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
                return;
              }
            }
          } else {
            logout();
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
    
    fetchUserData(accessToken);
     
  }, [])

  return <header className="bg-blue-600 p-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-white text-2xl font-bold">
          Scriptorium
        </Link>

        <div className="h-8  grow mx-4"></div>

        <nav className="hidden md:flex space-x-6" id="nav-links">
          <Link href="/search" className="text-white hover:text-gray-300 transition duration-200 ease-in-out">
            Explore
          </Link>
          {user ? (
            <>
              {user.userType === "ADMIN" &&
              <Link href="/admin/reports" className="text-white hover:text-gray-300 transition duration-200 ease-in-out">
                Reports
              </Link>}
              <Link href="/profile" className="text-white hover:text-gray-300 transition duration-200 ease-in-out">
                {`${user.firstName} ${user.lastName}`}
              </Link>
              <button
                onClick={() => {
                    router.push("/");
                    logout();
                  }
                }
                className="text-white hover:text-gray-300 transition duration-200 ease-in-out"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-white hover:text-gray-300 transition duration-200 ease-in-out">
                Log In
              </Link>
              <Link href="/signup" className="text-white hover:text-gray-300 transition duration-200 ease-in-out">
                Sign Up
              </Link>
            </>
          )}
        </nav>

        <button
          id="hamburger-menu"
          onClick={toggleMenu}
          className="md:hidden text-white focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div
          id="nav-links-sm"
          className="md:hidden flex flex-col space-y-4 mt-4 bg-blue-700 p-4"
        >
          <Link href="/search" className="text-white hover:text-gray-300">
            Search
          </Link>
          {user ? (
            <>
              <Link href="/newtemplate" className="text-white hover:text-gray-300">
                Create
              </Link>
              <Link href="/profile" className="text-white hover:text-gray-300">
                {`${user.firstName} ${user.lastName}`}
              </Link>
              <button
                onClick={logout}
                className="text-white hover:text-gray-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-white hover:text-gray-300">
                Log In
              </Link>
              <Link href="/signup" className="text-white hover:text-gray-300">
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
};