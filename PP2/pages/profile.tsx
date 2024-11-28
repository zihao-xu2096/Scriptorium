import { NavBar } from '@/components/navigation/NavBar';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Profile() {
  interface User {
    firstName: string;
    lastName: string;
    email: string;
    phoneNum: string;
    avatarUrl: string;
  }

  interface Post {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    description?: string;
    downvotes: number;
    isHidden: boolean;
    tags: { id: number; label: string }[];
    upvotes: number;
    userId: number;
  }

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [authorized, setAuthorized] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;
  useEffect(() => {
    const fetchUser = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const res = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (res.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          setAuthorized(false);
          return;
        }

        const refreshRes = await fetch('/api/refresh', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${refreshToken}`,
          }
        })

        if (refreshRes.status !== 200) {
          console.log('Access token refreshed');
          setAuthorized(false);
          return;
        }

        const refreshedAccessToken = await refreshRes.json();
        localStorage.setItem('accessToken', refreshedAccessToken.accessToken);
      }
      const data = await res.json();
      setUser(data);
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setPhoneNum(data.phoneNum);
      setAvatarUrl(data.avatarUrl);
    };

    const fetchUserPosts = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const res = await fetch('/api/user/fetchAuthorID', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (res.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          setAuthorized(false);
          return;
        }

        const refreshRes = await fetch('/api/refresh', {
          headers: {
            'Authorization': `Bearer ${refreshToken}`,
          }
        })

        if (refreshRes.status !== 200) {
          console.log('Access token refreshed');
          setAuthorized(false);
          return;
        }

        const refreshedAccessToken = await refreshRes.json();
        localStorage.setItem('accessToken', refreshedAccessToken.accessToken);
      }

      const data = await res.json()
      const authorID = data.authorID;
      console.log(authorID)
      const resPosts = await fetch(`/api/blog-posts/?author=${authorID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      const postData = await resPosts.json();
      console.log(postData)
      setPosts(postData);
    };

    fetchUser();
    fetchUserPosts();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const accessToken = localStorage.getItem('accessToken');
    const res = await fetch('/api/editProfile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ firstName, lastName, phoneNum, avatarUrl }),
    });

    if (res.status !== 200) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        setAuthorized(false);
        return;
      }

      const refreshRes = await fetch('/api/refresh', {
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
        }
      })

      if (refreshRes.status !== 200) {
        setAuthorized(false);
        alert('Update failed');
        return;
      }
    }
    
    const updatedUser = await res.json();
    setUser(updatedUser.user);
    setEditMode(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);


  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center text-white">Not Authorized/Not Logged In</h2>
          <p className="text-center text-sm text-gray-400">
            <Link href="/login" className="text-indigo-500 hover:text-indigo-400 underline">Login here</Link>.
          </p>          
        </div>
      </div>
    );
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
      <div className="flex flex-col items-center bg-gray-900 min-h-screen">
        <NavBar />
        <div className="flex flex-row items-center bg-gray-900 min-h-screen">

          <div className="w-[600px] mx-10 p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-center text-white">Profile</h2>
            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 mt-1 text-gray-900 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 mt-1 text-gray-900 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phoneNum" className="block text-sm font-medium text-gray-300">Phone Number</label>
                  <input
                    type="text"
                    id="phoneNum"
                    value={phoneNum}
                    onChange={(e) => setPhoneNum(e.target.value)}
                    className="w-full px-3 py-2 mt-1 text-gray-900 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-300">Avatar URL</label>
                  <input
                    type="text"
                    id="avatarUrl"
                    
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-3 py-2 mt-1 text-gray-900 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="w-full px-4 py-2 mt-2 font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">First Name</label>
                  <p className="mt-1 text-gray-100">{user.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Last Name</label>
                  <p className="mt-1 text-gray-100">{user.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Email</label>
                  <p className="mt-1 text-gray-100">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Phone Number</label>
                  <p className="mt-1 text-gray-100">{user.phoneNum}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Profile Picture</label>
                  <img src={user.avatarUrl} alt="Avatar" className="mt-1 rounded-full w-24 h-24 text-gray-100" />
                </div>
                <button
                  onClick={() => setEditMode(true)}
                  className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          <div className="mx-10 flex-1 w-full max-w-md h-[555px] p-8 bg-gray-800 rounded-lg shadow-lg flex flex-col">
            <h2 className="text-3xl font-bold text-center text-white">My Blog Posts</h2>
            <div className="flex-1 mt-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-track-gray-700">
              {currentPosts.map((post) => (
                <div key={post.id} className="p-4 bg-gray-700 rounded-md shadow-md">
                  <h3 className="text-xl font-bold text-white">{post.title}</h3>
                  <Link href={`/blog-posts/${post.id}`} className="text-indigo-500 hover:text-indigo-400 underline">
                    Read more
                  </Link>
                </div>
                        ))}
            </div>

            <div className="flex justify-center space-x-2 mt-4">
              {Array.from({ length: totalPages }, (_, index) => (
              <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`px-3 py-1 rounded-md ${
              currentPage === index + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}
              >
              {index + 1}
              </button>
              ))}
            </div>
          </div>

        </div>
    </div>
    
  );
}