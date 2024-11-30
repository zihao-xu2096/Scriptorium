import { NavBar } from '@/components/navigation/NavBar';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface Report {
  id: number;
  userId: number;
  explanation: string;
  postId: number | null;
  commentId: number | null;
}

interface PostOrComment {
  id: number;
  createdAt: string;
  content: string;
  userId: number;
  isHidden: boolean;
  postId: number | null;
  parentId: number | null;
  upvotes: number;
  downvotes: number;
  reports: Report[];
  _count: {
    reports: number;
  };
  type: 'post' | 'comment';
}

const extractTextFromContent = (content: string): string => {
  try {
    const parsedContent = JSON.parse(content);
    return parsedContent
      .map((block: any) => block.children.map((child: any) => child.text).join(' '))
      .join(' ');
  } catch (error) {
    console.error('Error parsing content:', error);
    return '';
  }
};

export default function RecentPosts() {
  const router = useRouter();
  const [items, setItems] = useState<PostOrComment[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [filter, setFilter] = useState<'all' | 'posts' | 'comments'>('all');
  const [sortOrder, setSortOrder] = useState<'most' | 'least'>('most');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const maxPageButtons = 5;

  useEffect(() => {
    fetchUserType();
  }, []);

  useEffect(() => {
    if (userType === 'ADMIN') {
      fetchContent();
    }
  }, [userType]);

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
      const response = await fetch('/api/reports', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      console.log("data", data);
      const itemsWithType = data.map((item: PostOrComment) => ({
        ...item,
        type: item.postId ? 'comment' : 'post',
      }));
      setItems(itemsWithType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoadingContent(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'posts') return item.type === 'post';
    if (filter === 'comments') return item.type === 'comment';
    return true;
  });

  const sortedItems = filteredItems.sort((a, b) => {
    if (sortOrder === 'most') {
      return b.reports.length - a.reports.length;
    } else {
      return a.reports.length - b.reports.length;
    }
  });

  const paginatedItems = sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPageButtons = () => {
    const pageButtons = [];
    const startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-4 py-2 mx-1 rounded-lg ${currentPage === i ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300'}`}
        >
          {i}
        </button>
      );
    }

    return pageButtons;
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
        <h1 className="text-3xl font-bold text-white mb-6">Reported Blog Posts and Comments</h1>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="flex space-x-4 mb-4 sm:mb-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('posts')}
              className={`px-4 py-2 rounded-lg ${filter === 'posts' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            >
              Posts
            </button>
            <button
              onClick={() => setFilter('comments')}
              className={`px-4 py-2 rounded-lg ${filter === 'comments' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            >
              Comments
            </button>
          </div>
          <div className="flex space-x-4">
            <label htmlFor="sortOrder" className="text-gray-300">Sort by:</label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'most' | 'least')}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300"
            >
              <option value="most">Most Reports</option>
              <option value="least">Least Reports</option>
            </select>
          </div>
        </div>

        {loadingContent ? (
          <div className="text-white">Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedItems.map((item) => {
                console.log(item); // Log each item in paginatedItems
                return (
                  <div
                    key={item.id}
                    className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700 w-full cursor-pointer transform transition-transform duration-200 hover:scale-105"
                    onClick={() => router.push(`/admin/reports/${item.type === 'post' ? 'blog' : 'comment'}/${item.id}`)}
                  >
                    <h2 className="text-xl font-bold text-white mb-2">{item.type === 'post' ? 'Post' : 'Comment'}</h2>
                    <p className="text-gray-400 mb-4">
                      {item.type === 'post' ? extractTextFromContent(item.content) : item.content}
                    </p>
                    <div className="text-gray-500 mb-2">Reports: {item.reports.length}</div>
                    <Link href={item.type === 'post' ? `/blogs/${item.id}` : `/blogs/${item.postId}`} className="text-indigo-500 hover:text-indigo-400 underline mt-4 block" onClick={(e) => e.stopPropagation()}>
                      View {item.type === 'post' ? 'Post' : 'Comment'}
                    </Link>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center mt-6">
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="px-4 py-2 mx-1 rounded-lg bg-gray-800 text-gray-300"
                >
                  &lt;
                </button>
              )}
              {renderPageButtons()}
              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-4 py-2 mx-1 rounded-lg bg-gray-800 text-gray-300"
                >
                  &gt;
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}