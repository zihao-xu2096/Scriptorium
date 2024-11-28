import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { UserContext } from '@/context/UserContext';
import { UserPayload } from "@/new-types";
import { Post, CodeTemplate } from '@prisma/client';

const Dashboard = () => {
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

export default Dashboard;
