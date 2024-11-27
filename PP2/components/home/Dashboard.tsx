import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { UserContext } from '@/context/UserContext';
import { UserPayload } from "@/new-types";
import { Post, CodeTemplate } from '@prisma/client';

const Dashboard = () => {
  const [blogPosts, setBlogPosts] = useState<Post[]>([]);
  const [templates, setTemplates] = useState<CodeTemplate[]>([]);
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


    const fetchData = async () => {
      try {
        const responses = await Promise.all([
          fetch('/api/blog-posts', {
            method: "GET",
            headers: {Authorization: `Bearer ${localStorage.getItem('accessToken')}`}
          }), 
          fetch('/api/template', {
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
    };
    
    fetchData();
  }, []);

  return (
    user &&
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">
      <header className="flex justify-between items-center p-6 bg-white dark:bg-gray-800 shadow-md">
        <div>
          <h2 className="text-xl font-semibold">Welcome, {user.firstName}!</h2>
        </div>
        <div className="flex items-center space-x-4">
          <img
            src={"/avatars/avatar1.png"}
            alt="Avatar"
            className="w-12 h-12 rounded-full"
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 focus:outline-none"
          >
            Toggle Theme
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => router.push('/blog/create')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 focus:outline-none"
          >
            Create New Post
          </button>
          <button
            onClick={() => router.push('/templates/create')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 focus:outline-none"
          >
            Create New Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">My Blog Posts</h3>
            {blogPosts.length > 0 ? (
              blogPosts.map((post) => (
                <div key={post.id} data-id={post.id} className="post mb-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">{post.title}</h4>
                  <div className="mt-4 flex space-x-4">
                    <button
                      onClick={() => router.push(`/blog/${post.id}`)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
                    >
                      View Post
                    </button>
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-500">
                      Edit
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No blog posts yet. Start writing!</p>
            )}
          </section>

          {/* Templates */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">My Templates</h3>
            {templates.length > 0 ? (
              templates.map((template) => (
                <div key={template.id} data-id={template.id} className="mb-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">{template.title}</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-400">{template.explanation}</p>
                  <div className="mt-4 flex space-x-4">
                    <button
                      onClick={() => router.push(`/templates/${template.id}`)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
                    >
                      View Template
                    </button>
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-500">
                      Edit
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No templates saved yet. Create one!</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
