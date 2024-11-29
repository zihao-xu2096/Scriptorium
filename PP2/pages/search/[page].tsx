import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getAuthorName } from 'utils/authors';
import { refreshAccessToken } from 'utils/refresh';

interface Template {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  language: string;
  tags: string[];
  author: string;
  authorId: number;
}

interface Tag {
  id: string;
  name: string;
}

// Add these constants at the top
const ITEMS_PER_PAGE = 21; // 3x7 grid
const USER_TEMPLATES_LIMIT = 6;

export default function SearchTemplates() {
  const router = useRouter();
  const { page } = router.query;
  const currentPage = parseInt(page as string) || 1;

  const [allTemplates, setAllTemplates] = useState<Template[]>([]); // Store all templates
  const [displayedTemplates, setDisplayedTemplates] = useState<Template[]>([]); // Store current page templates

  const [userTemplates, setUserTemplates] = useState<Template[]>([]);

  const [searchType, setSearchType] = useState('language'); // default to language search
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      // Call the templates API with the search query
      const url = searchQuery
        ? `/api/template?${searchType}=${encodeURIComponent(searchQuery)}`
        : '/api/template';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const templatesData = await response.json();

      // Fetch author details for each template
      const templatesWithAuthors = await Promise.all(
        templatesData.map(async (template: any) => {
          const tagNames = template.tags?.map((tag: Tag) => tag.name) || [];
          try {
            const authorName = await getAuthorName(template.authorId);

            return {
              id: template.id.toString(),
              title: template.title,
              description: template.explanation,
              imageUrl: '/background/wave.jpg',
              language: template.language,
              author: authorName,
              authorId: template.authorId,
              tags: tagNames
            };
          } catch (error) {
            console.error('Error fetching author details:', error);
            return {
              id: template.id.toString(),
              title: template.title,
              description: template.explanation,
              imageUrl: '/background/wave.jpg',
              language: template.language,
              author: 'Unknown Author',
              authorId: template.authorId,
              tags: tagNames
            };
          }
        })
      );

      setAllTemplates(templatesWithAuthors);
      updateUserTemplates(templatesWithAuthors);
      updateDisplayedTemplates(templatesWithAuthors, currentPage);
    } catch (error) {
      console.error('Error searching templates:', error);
    }
    // You might want to add error handling UI here
  };

  // Add function to filter user's templates
  const updateUserTemplates = (templates: Template[]) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const decodedToken = JSON.parse(atob(accessToken.split('.')[1]));
      const userId = decodedToken.id;

      const userOwnedTemplates = templates
        .filter(template => template.authorId === userId)
        .slice(0, USER_TEMPLATES_LIMIT); // Limit to 6 templates

      setUserTemplates(userOwnedTemplates);
    } catch (error) {
      console.error('Error filtering user templates:', error);
    }
  };

  // Display templates based on current page
  const updateDisplayedTemplates = (templates: Template[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedTemplates(templates.slice(startIndex, endIndex));
  };

  // Update displayed templates when page changes
  useEffect(() => {
    updateDisplayedTemplates(allTemplates, currentPage);
  }, [currentPage, allTemplates]);

  // Initial search
  useEffect(() => {
    handleSearch();
  }, [searchQuery, searchType]);

  const totalPages = Math.ceil(allTemplates.length / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    router.push({
      pathname: '/search/[page]',
      query: {
        page: newPage,
        ...(searchQuery && { q: searchQuery }),
        ...(searchType && { type: searchType })
      }
    });
  };

  // Seed data button
  const handleSeedDatabase = async () => {
    try {
      const programmingLanguages = ['JavaScript', 'Python', 'TypeScript', 'Java', 'C++', 'Ruby', 'Go'];
      const templateTypes = ['Function', 'Class', 'Algorithm', 'Utility', 'Component', 'Setup'];
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('User not authenticated');
      }

      // Decode the JWT token to get user ID
      const decodedToken = JSON.parse(atob(accessToken.split('.')[1]));
      const authorId = decodedToken.id; // Convert to number

      if (authorId === undefined || authorId === null) {
        throw new Error('User ID not found in token');
      }
      const promises = Array(50).fill(null).map(async (_, index) => {
        const language = programmingLanguages[Math.floor(Math.random() * programmingLanguages.length)];
        const type = templateTypes[Math.floor(Math.random() * templateTypes.length)];

        // Match the exact fields required by the API
        const templateData = {
          title: `${language} ${type} Template ${index + 1}`,
          explanation: `A helpful ${type.toLowerCase()} template for ${language} that demonstrates best practices and common patterns.`,
          language,
          code: `// Example ${language} code\nfunction example${type}${index + 1}() {\n  console.log("This is a sample template");\n}`,
          authorId: authorId,
          tags: [language, type]
        };
        const response = await fetch('/api/template', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(templateData)
        });
        if (!response.ok) {
          const { success } = await refreshAccessToken();
          if (!success) {
            alert('Unauthorized');
            const errorData = await response.json();
            alert(`Failed to create template: ${errorData.error || response.statusText}`);
            setTimeout(() => {
              router.push('/login');
            }, 100);
          }
        }
        return response.json();
      });
      await Promise.all(promises);
      alert('Successfully added 50 templates!');
      // Refresh the templates list
      handleSearch();
    } catch (error) {
      console.error('Error seeding database:', error);
      alert('Failed to seed database: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => router.push('/profile')}
          className="mb-4 px-4 py-2 text-gray-300 hover:text-white flex items-center transition-colors duration-200 group"
        >
          <span className="mr-2 text-lg font-medium group-hover:transform group-hover:-translate-x-1 transition-transform duration-200 flex items-center">←</span>
          <span className="font-medium flex items-center">Back to Profile </span>
        </button>

        <h1 className="text-3xl font-bold text-white mb-6">Find Templates</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-4 mb-8">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="p-3 bg-gray-800 border-gray-700 text-white rounded-lg"
          >
            <option value="language">Language</option>
            <option value="tag">Tag</option>
            <option value="templateName">Title</option>
            <option value="authorName">Author</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search by ${searchType}...`}
            className="flex-1 p-3 bg-gray-800 border-gray-700 text-white 
            placeholder-gray-400 rounded-lg shadow-sm 
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg 
                   hover:bg-indigo-700 focus:outline-none focus:ring-2 
                   focus:ring-offset-2 focus:ring-indigo-500 
                   focus:ring-offset-gray-900" // Added offset color
          >
            Search
          </button>
        </form>
        <div className="flex justify-between items-center mb-8">
          <span></span>
          <button
            onClick={() => router.push('/newtemplate')}
            className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg 
                       hover:bg-emerald-700 focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-blue-500 
                       focus:ring-offset-gray-900"
          >
            + New Template
          </button>
        </div>
        {/* User's Templates Section - Only show on first page */}
        {currentPage === 1 && userTemplates.length > 0 && (
          <div className="mb-12 bg-rose-900/30 rounded-xl p-6 border border-rose-800/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Your Templates</h2>
              {/* {userTemplates.length === USER_TEMPLATES_LIMIT && (
                <Link
                  href="/search/1?type=authorid&q=me"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  View All →
                </Link>
              )} */}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={`/templateview/${template.id}`}
                  className="block"
                >
                  <div
                    key={template.id}
                    className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:scale-[1.02] 
                  transform transition-all duration-300 border border-gray-700 
                  flex flex-col h-full"
                  >
                    {/* Template Image */}
                    <div className="aspect-w-16 aspect-h-9">
                      <img
                        src={template.imageUrl}
                        alt={template.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    {/* Template Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        {/* Updated text colors */}
                        <h3 className="text-lg font-semibold text-white">
                          {template.title}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium text-indigo-400 
                                bg-indigo-900 rounded-full">
                          {template.language}
                        </span>
                      </div>

                      {/* Updated description color */}
                      <p className="text-gray-400 text-sm mb-4">
                        {template.description}
                      </p>
                      <div className="mb-2 flex flex-wrap gap-1">
                        <span>tags : </span>
                        {template.tags.map((tag: String, index: number) => (
                          <span
                            key={`${template.id}-${tag}-${index}`}
                            className="px-3 py-0.5 my-0.5 text-sm font-medium text-green-400 bg-green-900 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        {/* Updated stats color */}
                        <span className="text-sm text-gray-500">
                          By {template.author}
                        </span>
                        {/* Updated button color */}
                        {/* <button
                        onClick={(e) => {
                          e.preventDefault();
                          // Add your preview logic here
                        }}
                        className="px-4 py-2 text-sm font-medium text-indigo-400 
                      hover:text-indigo-300"
                      >
                        Preview →
                      </button> */}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Template Grid */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Search</h2>
            {/* {userTemplates.length === USER_TEMPLATES_LIMIT && (
                <Link
                  href="/search/1?type=authorid&q=me"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  View All →
                </Link>
              )} */}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedTemplates.map((template) => (
              <Link
                key={template.id}
                href={`/templateview/${template.id}`}
                className="block"
              >
                <div
                  key={template.id}
                  className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:scale-[1.02] 
                  transform transition-all duration-300 border border-gray-700 
                  flex flex-col h-full"
                >
                  {/* Template Image */}
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={template.imageUrl}
                      alt={template.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  {/* Template Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      {/* Updated text colors */}
                      <h3 className="text-lg font-semibold text-white">
                        {template.title}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium text-indigo-400 
                              bg-indigo-900 rounded-full">
                        {template.language}
                      </span>
                    </div>

                    {/* Updated description color */}
                    <p className="text-gray-400 text-sm mb-4">
                      {template.description}
                    </p>
                    <div className="mb-2 flex flex-wrap gap-1">
                      <span>tags : </span>
                      {template.tags.map((tag: String, index: number) => (
                        <span
                          key={`${template.id}-${tag}-${index}`}
                          className="px-3 py-0.5 my-0.5 text-sm font-medium text-green-400 bg-green-900 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      {/* Updated stats color */}
                      <span className="text-sm text-gray-500">
                        By {template.author}
                      </span>
                      {/* Updated button color */}
                      {/* <button
                      onClick={(e) => {
                        e.preventDefault();
                        // Add your preview logic here
                      }}
                      className="px-4 py-2 text-sm font-medium text-indigo-400 
                    hover:text-indigo-300"
                    >
                      Preview →
                    </button> */}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Add pagination controls */}
        <div className="my-8 flex justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
          >
            Previous
          </button>

          <span className="px-4 py-2 text-white">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}