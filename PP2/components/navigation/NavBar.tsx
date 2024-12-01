import { UserContext } from "@/context/UserContext";
import Link from "next/link";
import { useRouter } from "next/router";
import { MouseEventHandler, useContext, useEffect, useState } from "react";


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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selection, setSelection] = useState('');

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSelection = (type: string) => {
    setSelection(type);
    setIsModalOpen(false);  // Close modal after selection
    if (type === 'template') {
      router.push('/newtemplate')
    } else {
      router.push('/blogs/create')
    }
  };

  

  return <> <header className="bg-blue-600 p-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-white text-2xl font-bold">
          Scriptorium
        </Link>

        <div className="h-8 border-gray-500 grow mx-4"></div>

        <nav className="hidden md:flex space-x-6" id="nav-links">
          <span className="text-white opacity-50">|</span>
          <Link href="/search" className="text-white hover:text-gray-300 transition duration-200 ease-in-out">
            Search
          </Link>
          {user ? (
            <>
              {user.userType === "ADMIN" && (
                <>
                  <span className="text-white opacity-50">|</span>
                  <Link href="/admin/reports" className="text-white hover:text-gray-300 transition duration-200 ease-in-out">
                    Reports
                  </Link>
                </>
              )}
              <button  className="text-white hover:text-gray-300" onClick={handleOpenModal}>
                Create
              </button>
              <span className="text-white opacity-50">|</span>
              <Link href="/profile" className="text-white hover:text-gray-300 transition duration-200 ease-in-out">
                {`${user.firstName} ${user.lastName}`}
              </Link>
              <span className="text-white opacity-50">|</span>
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
            {user.userType === "ADMIN" && (
                <>
                  <span className="text-white opacity-50">|</span>
                  <Link href="/admin/reports" className="text-white hover:text-gray-300 transition duration-200 ease-in-out">
                    Reports
                  </Link>
                </>
              )}
              <button  className="text-white hover:text-gray-300" onClick={handleOpenModal}>
                Create
              </button>
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
    <Modal isOpen={isModalOpen} onClose={handleCloseModal} onSelect={handleSelection} />
    </>
};


interface ModalProps {
  isOpen: boolean
  onClose: MouseEventHandler<HTMLButtonElement>
  onSelect: Function
}

const Modal = ({ isOpen, onClose, onSelect }: ModalProps) => {
  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-6 w-80">
          <div className="text-center text-2xl font-semibold mb-6">Select an Option</div>
          
          {/* Flexbox container for options in columns */}
          <div className="flex justify-between">
            {/* Create Blog Post Option */}
            <button
              className="flex flex-col items-center w-28 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => onSelect('blog')}
            >
              <span className="material-icons text-3xl mb-2">article</span>
              <span>Create Blog Post</span>
            </button>
  
            {/* Create Code Template Option */}
            <button
              className="flex flex-col items-center w-28 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              onClick={() => onSelect('template')}
            >
              <span className="material-icons text-3xl mb-2">code</span>
              <span>Create Code Template</span>
            </button>
          </div>
  
          <div className="mt-4 flex justify-end">
            <button
              className="text-gray-600 hover:text-gray-800"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  