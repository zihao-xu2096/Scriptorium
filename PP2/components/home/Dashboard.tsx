import { UserContext } from '@/context/UserContext';
import { UserPayload } from "@/new-types";
import Link from 'next/link';
import { CodeTemplate, Post } from '@prisma/client';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';

interface PostWithDisplay extends Post {
  tags: {
      label: string;
  }[],
  createdBy: {
    firstName: string;
    lastName: string;
};
}

interface CodeTemplatesWithDisplay extends CodeTemplate {
  tags: {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    name: string;
  }[];
  author: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
  };
}

export const Dashboard = () => {
  const [blogPosts, setBlogPosts] = useState<PostWithDisplay[]>([]);
  const [templates, setTemplates] = useState<CodeTemplatesWithDisplay[]>([]);
  const [mostValuedPosts, setMostValuedPosts] = useState<PostWithDisplay[]>([]);
  const { user, loading, login } = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const responses = await Promise.all([
            fetch(`/api/blog-posts?author=${user.id}&limit=3`, {
              method: "GET",
              headers: {Authorization: `Bearer ${localStorage.getItem('accessToken')}`}
            }), 
            fetch(`/api/template?authorId=${user.id}`, {
              method: 'GET'
            }),
            fetch(`/api/blog-posts?limit=5&sortBy=mostValued`, {
              method: "GET",
              headers: {Authorization: `Bearer ${localStorage.getItem('accessToken')}`}
            })
          ]);

          if (responses.some((value) => value.status === 401)) {
            router.push('/');
          } else if (responses.some(value => !value.ok)) {
            console.log(responses)
          }

          const [blogPostsData, templatesData, mostValued] = await Promise.all(
            responses.map(response => response.json())
          );

          setBlogPosts(blogPostsData);
          setTemplates(templatesData.slice(0,3));
          setMostValuedPosts(mostValued)
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
      <h1 className="text-6xl font-serif lg:text-8xl text-center md:text-left md:px-40 pt-10 text-blue-600">
  Welcome to your Dashboard, {user.firstName}
</h1>
      <div className="container mx-auto p-6 grid lg:grid-flow-col grid-cols-1 lg:grid-rows-[auto,_auto] lg:grid-cols-2 lg:grid-cols-[2fr_1fr] gap-8 sm:gap-12">
        
        {/* Left Side - Recent Blog Posts and Templates */}
          {/* Recent Blog Posts */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Recent Blog Posts</h3>
            {blogPosts.length > 0 ? 
                <div className="flex flex-col space-y-4">
                {blogPosts.map((post, index) => (
                  <Link key={index} href={`/blogs/${post.id}`}>
                    <div  className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
                      <h3 className="font-bold text-lg text-gray-500">{post.title}</h3>
                      <p className="text-sm text-gray-500">{post.description}</p>
                      <div className="mt-2 flex space-x-2">
                        {post.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-600 bg-green-100 rounded-full"
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
                </div>
             : (
              <p className="text-gray-500">No recent blog posts available.</p>
            )}
          </section>

          {/* Recent Templates */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Recent Templates</h3>
            {templates.length > 0 ? (
              <div className="flex flex-col space-y-4">
              {templates.map((template, index) => (
              <div key={index} className="p-4 bg-white rounded-l text-gray-800 shadow-md border border-gray-200 ">
                <h3 className="font-bold text-lg">{template.title}</h3>
                <div className="mt-2 flex space-x-2">
                  {template.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
              ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent templates available.</p>
            )}
          </section>

        {/* Right Side - Most Valued Posts / General Info */}
          {/* Most Valued Blog Posts */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Featured Posts</h3>
            {mostValuedPosts.length > 0 ? (
              <div className="grid grid-cols-1  gap-4">
              {mostValuedPosts.map((post, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-2 bg-white pl-4 rounded-md hover:bg-gray-50 transition duration-200"
                  >
                    <div className="flex-1">
                      <Link href={`/blog/${post.id}`} className="font-semibold text-sm text-blue-600 hover:text-blue-800 truncate">
                          {post.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1 truncate">{`${post.createdBy.firstName} ${post.createdBy.lastName}`}</p>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-1">
                      {/* Material Icon: Favorite (Heart) */}
                      <span className="text-sm">{post.upvotes}</span>
                      <span className="material-icons text-red-500">favorite</span>
                    </div>
                  </div>
              ))}
              </div>
            ) : (
              <p className="text-gray-500">No valued posts yet.</p>
            )}
          </section>

          {/* General Information */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md lg:flex lg:flex-col lg:justify-center lg:space-y-6 lg:h-100%">
          <h3 className="text-xl font-semibold mb-4 md:mb-0">Quick Actions</h3>
          <ul className="space-y-4">
            <li>
              <Link href="/templates/new">
                <div className="flex items-center space-y-2 space-x-3 md:flex-col p-3 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition duration-300">
                  <span className="material-icons text-indigo-600">add_circle</span>
                  <span className="text-indigo-600 font-normal text-lg md:text-base">Create New Template</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/blog/write">
                <div className="flex items-center space-y-2 space-x-3 md:flex-col p-3 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition duration-300">
                  <span className="material-icons text-yellow-600">create</span>
                  <span className="text-yellow-600 font-normal text-lg md:text-base">Write Blog Post</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/profile/settings">
                <div className="flex space-x-3 md:flex-col items-center space-y-2 p-3 bg-green-100 rounded-lg hover:bg-green-200 transition duration-300">
                  <span className="material-icons text-green-600">settings</span>
                  <span className="text-green-600 font-normal text-lg md:text-base">Account Settings</span>
                </div>
              </Link>
            </li>
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
          
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;

