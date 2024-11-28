import { UserContext } from '@/context/UserContext';
import { UserPayload } from "@/new-types";
import Link from 'next/link';
import { CodeTemplate, Post } from '@prisma/client';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';

export const Dashboard = () => {
  const [blogPosts, setBlogPosts] = useState<Post[]>([]);
  const [templates, setTemplates] = useState<CodeTemplate[]>([]);
  const [mostValuedPosts, setMostValuedPosts] = useState<Post[]>([]);
  const { user, loading, login } = useContext(UserContext);
  const router = useRouter();

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
              router.push('/login');
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
            router.push('/login');
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
    } else {
        router.push('/login');
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const responses = await Promise.all([
            fetch(`/api/blog-posts?author=${user.id}`, {
              method: "GET",
              headers: {Authorization: `Bearer ${localStorage.getItem('accessToken')}`}
            }), 
            fetch(`/api/template?authorId=${user.id}`, {
              method: 'GET'
            }),
          ]);

          if (responses.some((value) => value.status === 401)) {
            router.push('/login');
          } else if (responses.some(value => !value.ok)) {
            console.log(responses)
          }

          const [blogPostsData, templatesData] = await Promise.all(
            responses.map(response => response.json())
          );

          setBlogPosts(blogPostsData);
          setTemplates(templatesData);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };
    
    fetchData();
  }, [user]);

  return (
    user &&    
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
      {/* Main Content */}
      <div className="container mx-auto p-6 grid md:grid-flow-col grid-cols-1 md:grid-rows-2 md:grid-cols-2 md:grid-cols-[2fr_1fr] gap-8 sm:gap-12">
        
        {/* Left Side - Recent Blog Posts and Templates */}
          {/* Recent Blog Posts */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Recent Blog Posts</h3>
            {blogPosts.length > 0 ? (
              blogPosts.map((post) => (
                <div key={post.id} className="mb-4">
                  <h4
                    className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    onClick={() => router.push(`/blog/${post.id}`)}
                  >
                    {post.title}
                  </h4>
                  {post.description && <p className="text-gray-500">{post.description}</p>}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent blog posts available.</p>
            )}
          </section>

          {/* Recent Templates */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Recent Templates</h3>
            {templates.length > 0 ? (
              templates.map((template) => (
                <div key={template.id} className="mb-4">
                  <h4
                    className="text-lg font-semibold text-green-600 dark:text-green-400 hover:underline cursor-pointer"
                    onClick={() => router.push(`/templates/${template.id}`)}
                  >
                    {template.title}
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{template.explanation}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent templates available.</p>
            )}
          </section>

        {/* Right Side - Most Valued Posts / General Info */}
          {/* Most Valued Blog Posts */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Most Valued Blog Posts</h3>
            {mostValuedPosts.length > 0 ? (
              mostValuedPosts.map((post) => (
                <div key={post.id} className="mb-4">
                  <h4
                    className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    onClick={() => router.push(`/blog/${post.id}`)}
                  >
                    {post.title}
                  </h4>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No valued posts yet.</p>
            )}
          </section>

          {/* General Information */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Hi, {user.firstName}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Welcome to your Scriptorium page!
            </p>
            <ul className="space-y-2 mt-4 text-gray-700 dark:text-gray-300">
              <li>Total Posts: 256</li>
              <li>Total Templates: 124</li>
              <li>Active Users: 102</li>
            </ul>
          </section>
      </div>
    </div>
  );
};

const Dash = () => {
  // Sample user data for demonstration
  const user = {
    loggedIn: true,
    username: "JohnDoe",
    recentActivity: [
      "Created a new Python template: Fibonacci sequence",
      "Commented on a blog post: 'Understanding Recursion'",
      "Forked a C++ template: Merge Sort Algorithm"
    ],
    savedTemplates: [
      { title: "Fibonacci Sequence in Python", tags: ["python", "algorithm"], author: "JohnDoe" },
      { title: "Merge Sort in C++", tags: ["cpp", "algorithm"], author: "JaneDoe" }
    ],
    recentBlogs: [
      { title: "Exploring Recursion in Programming", author: "JohnDoe", tags: ["recursion", "python"] },
      { title: "Understanding Memory Management in C++", author: "JaneDoe", tags: ["cpp", "memory"] }
    ]
  };

  // Use state to store dynamic content
  const [userData, setUserData] = useState(user);

  useEffect(() => {
    // Normally, you would fetch the user data from an API or context
    // setUserData(fetchedData);
  }, []);

  const viewAllTemplates = () => alert('Redirecting to view all templates...');
  const viewAllBlogs = () => alert('Redirecting to view all blog posts...');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-600">Welcome to your Dashboard, {userData.username}</h1>
          <p className="mt-4 text-lg text-gray-500">Here you can view your recent activity, manage your templates, and interact with blog posts.</p>
        </header>

        {/* Recent Activity */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-700">Recent Activity</h2>
          <div className="space-y-4">
            {userData.recentActivity.map((activity, index) => (
              <div key={index} className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
                {activity}
              </div>
            ))}
          </div>
        </section>

        {/* Featured Templates */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-700">Featured Templates</h2>
          <div className="space-y-4">
            {userData.savedTemplates.map((template, index) => (
              <div key={index} className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
                <h3 className="font-bold text-lg">{template.title}</h3>
                <p className="text-sm text-gray-500">Tags: {template.tags.join(", ")}</p>
              </div>
            ))}
          </div>
          <button
            onClick={viewAllTemplates}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700"
          >
            View All Templates
          </button>
        </section>

        {/* Recent Blog Posts */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-700">Recent Blog Posts</h2>
          <div className="space-y-4">
            {userData.recentBlogs.map((blog, index) => (
              <div key={index} className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
                <h3 className="font-bold text-lg">{blog.title}</h3>
                <p className="text-sm text-gray-500">By: {blog.author} | Tags: {blog.tags.join(", ")}</p>
              </div>
            ))}
          </div>
          <button
            onClick={viewAllBlogs}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700"
          >
            View All Blogs
          </button>
        </section>

        {/* Sidebar with Quick Actions */}
        <aside className="hidden lg:block space-y-6">
          <h3 className="text-xl font-semibold text-gray-700">Quick Actions</h3>
          <ul className="space-y-3">
            <li>
              <Link href="/templates/new">
                <span className="text-blue-600 hover:underline cursor-pointer">Create New Template</span>
              </Link>
            </li>
            <li>
              <Link href="/blog/write">
                <span className="text-blue-600 hover:underline cursor-pointer">Write Blog Post</span>
              </Link>
            </li>
            <li>
              <Link href="/profile/settings">
                <span className="text-blue-600 hover:underline cursor-pointer">Account Settings</span>
              </Link>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;

