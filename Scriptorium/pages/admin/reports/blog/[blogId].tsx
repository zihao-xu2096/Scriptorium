import { NavBar } from '@/components/navigation/NavBar';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface Report {
  id: number;
  userId: number;
  explanation: string;
  postId: number | null;
  commentId: number | null;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

export default function ItemReports() {
  const router = useRouter();
  const { blogId } = router.query;
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    fetchUserType();
  }, []);

  useEffect(() => {
    if (userType === 'ADMIN' && blogId) {
      fetchReports(blogId as string);
    }
  }, [userType, blogId]);

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

  const fetchReports = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`/api/reports/blog/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900">
        <NavBar />
        <div className="flex items-center justify-center flex-grow">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900">
        <NavBar />
        <div className="flex items-center justify-center flex-grow">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <NavBar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-6">Reports for Blog {blogId}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-2">Report ID: {report.id}</h2>
              <p className="text-gray-400 mb-4">Explanation: {report.explanation}</p>
              <p className="text-gray-400 mb-4">Reported by: {report.createdBy.firstName} {report.createdBy.lastName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}