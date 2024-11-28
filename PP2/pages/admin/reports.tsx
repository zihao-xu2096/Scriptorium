import { NavBar } from '@/components/navigation/NavBar';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface Post {
  id: number;
  title: string;
  content: string;
  author: {
    name: string;
  };
  reports: number;
}

interface Comment {
  id: number;
  content: string;
  author: {
    name: string;
  };
  reports: number;
}

export default function RecentPosts() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [sortType, setSortType] = useState<'posts' | 'comments'>('posts');
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    fetchUserType();
  }, []);

  useEffect(() => {
    if (userType === 'ADMIN') {
      fetchContent();
    }
  }, [userType, sortType]);

  const fetchUserType = async () => {
    setLoadingUser(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('/api/user/fetchUserType', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user type');
      }

      const data = await response.json();
      setUserType(data.userType);
    } catch (err) {
      router.push('/login');
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchContent = async () => {
    setLoadingContent(true);
    setError(null);

    try {
    const accessToken = localStorage.getItem('accessToken');
      const postsResponse = await fetch('/api/reports', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
      }); 
      const commentsResponse = await fetch('/api/comments?sort=reports');

      if (!postsResponse.ok || !commentsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const postsData = await postsResponse.json();
      const commentsData = await commentsResponse.json();

      setPosts(postsData);
      setComments(commentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoadingContent(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900">
        <NavBar />
        <div className="flex items-center justify-center flex-grow">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (userType !== 'ADMIN') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900">
        <NavBar />
        <div className="flex items-center justify-center flex-grow">
          <div className="text-red-500">Unauthorized</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <NavBar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-6">Recent Blog Posts and Comments</h1>

        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => setSortType('posts')}
              className={`px-4 py-2 rounded-lg ${sortType === 'posts' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            >
              Sort by Posts
            </button>
            <button
              onClick={() => setSortType('comments')}
              className={`ml-4 px-4 py-2 rounded-lg ${sortType === 'comments' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            >
              Sort by Comments
            </button>
          </div>
        </div>

        {loadingContent ? (
          <div className="text-white">Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortType === 'posts' ? (
              posts.map((post) => (
                <div key={post.id} className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-2">{post.title}</h2>
                  <p className="text-gray-400 mb-4">{post.content}</p>
                  <div className="text-gray-500 mb-2">By {post.author.name}</div>
                  <div className="text-gray-500">Reports: {post.reports}</div>
                  <Link href={`/posts/${post.id}`} className="text-indigo-500 hover:text-indigo-400 underline mt-4 block">
                    View Post
                  </Link>
                </div>
              ))
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
                  <p className="text-gray-400 mb-4">{comment.content}</p>
                  <div className="text-gray-500 mb-2">By {comment.author.name}</div>
                  <div className="text-gray-500">Reports: {comment.reports}</div>
                  <Link href={`/comments/${comment.id}`} className="text-indigo-500 hover:text-indigo-400 underline mt-4 block">
                    View Comment
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}