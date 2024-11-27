import { useState } from 'react';
import Link from 'next/link';
interface Template {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  author: string;
}

export default function SearchTemplates() {
  const [searchType, setSearchType] = useState('language'); // default to language search
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<Template[]>([
    // Dummy data for display
    {
      id: '1',
      title: 'Modern Dashboard',
      description: 'Clean and modern admin dashboard template',
      imageUrl: '/background/wave.jpg',
      category: 'Javascript',
      author: "Author"
    },
    // Add more dummy templates as needed
  ]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      // Call the templates API with the search query
      const url = searchQuery
        ? `/api/Template?${searchType}=${encodeURIComponent(searchQuery)}`
        : '/api/Template';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      setTemplates(data.map((template: any) => ({
        id: template.id.toString(),
        title: template.title,
        description: template.explanation,
        imageUrl: '/background/wave.jpg', // You'll need to add image handling
        category: template.language,
        author: template.author?.name || 'Unknown Author'
      })));
    } catch (error) {
      console.error('Error searching templates:', error);
    }
    // You might want to add error handling UI here
  };

  // Add this function in your SearchTemplates component
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
          authorId: authorId, // The ID is already a number in the token
          tags: [language, type]
        };
        const response = await fetch('/api/Template', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(templateData)
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Template creation failed:', errorData);
          throw new Error(`Failed to create template: ${errorData.error || response.statusText}`);
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
    // Changed bg-gray-100 to bg-gray-900
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto mb-8">
        {/* Changed text-gray-900 to text-white */}
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
            <option value="id">TemplateID</option>
            <option value="authorid">AuthorID</option>
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
        {/* Seed Button - Only show if access token exists */}
        {(
          <button
            onClick={handleSeedDatabase}
            className="px-6 py-3 mb-8 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-gray-900"
          >
            Add Sample Templates
          </button>
        )}

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/template/${template.id}`}
              className="block"
            >
              <div
                key={template.id}
                // Updated card background and hover effects
                className="bg-gray-800 rounded-lg shadow-md overflow-hidden 
                     hover:shadow-lg transition-shadow duration-300 
                     border border-gray-700"
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
                      {template.category}
                    </span>
                  </div>

                  {/* Updated description color */}
                  <p className="text-gray-400 text-sm mb-4">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between">
                    {/* Updated stats color */}
                    <span className="text-sm text-gray-500">
                      By {template.author}
                    </span>
                    {/* Updated button color */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        // Add your preview logic here
                      }}
                      className="px-4 py-2 text-sm font-medium text-indigo-400 
                    hover:text-indigo-300"
                    >
                      Preview →
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}