import { refreshAccessToken } from '@/utils/refresh';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';


interface Template {
  id: string;
  title: string;
  explanation: string;
  language: string;
  code: string;
  tags: string[];
  author: string;
  authorId: string;
  parentId: string;
}


export default function TemplateDetail() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [explanation, setExplanation] = useState('');
  const [language, setLanguage] = useState('');
  const [code, setCode] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [currentUserID, setCurrentUserID] = useState<number | null>(null);

  useEffect(() => {
    fetchCurrentUserID();
  }, [])

  const fetchCurrentUserID = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('/api/user/fetchAuthorID', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUserID(data.authorID);
      }
    } catch (error) {
      console.error('Failed to fetch current user ID:', error);
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        const { success } = await refreshAccessToken();
        if (!success) {
          alert('Log in to save templates');
          setTimeout(() => {
            router.push('/login');
          }, 100);
        }
      }

      const authorId = currentUserID

      // Validate fields before sending and alert user if not all fields are filled (except tags)
      if (!title.trim()) {
        alert('Title is required');
        return;
      }
      if (!explanation.trim()) {
        alert('Description is required');
        return;
      }
      if (!language.trim()) {
        alert('Programming language is required');
        return;
      }
      if (!code.trim()) {
        alert('Code is required');
        return;
      }
      if (!authorId) {
        alert('You must be logged in to create a template');
        return;
      }

      const data = {
        title: title,
        explanation: explanation,
        language: language.toLowerCase(),
        code: code,
        authorId: authorId,
        tags: tags
      }

      console.log(data)

      const response = await fetch('/api/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const { success } = await refreshAccessToken();
        if (!success) {
          alert('Log in to save templates');
          const errorData = await response.json();
          setTimeout(() => {
            router.push('/login');
          }, 100);
        }
      } else {
        const newTemplate = await response.json();
        if (confirm("Successfully forked! Would you like to go to your new forked template?")) {
          router.push(`/templateview/${newTemplate.template.id}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    }
  };

  // Add this new function before the return statement
  const handleRun = async () => {
    setIsRunning(true);
    setRunError(null);
    setOutput('');

    // Get the current code
    if (!code || !language) {
      setRunError('Code or language is missing');
      setIsRunning(false);
      return;
    }
    const normalizedLanguage = language.toLowerCase().replace('c++', 'cpp');

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: normalizedLanguage,
          code: code,
          stdin: '', // Add stdin support later if needed
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to compile code');
      }

      setOutput(data.output || 'No output');
    } catch (err) {
      console.error('Full error:', err); // Log the full error
      setRunError(err instanceof Error ? err.message : 'Failed to run code');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Template Title"
            className="w-full bg-gray-700 text-white text-3xl font-bold mb-4 p-2 rounded"
          />

          <div className="mb-6">
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Programming Language"
              className="px-3 py-1 text-sm font-medium bg-gray-700 text-indigo-400 rounded-full"
            />
          </div>

          {/* Set Tags */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-full flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tags"
                className="flex-1 bg-gray-700 text-gray-300 p-2 rounded"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Add Tag
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Description</h2>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Enter template description"
              className="w-full bg-gray-700 text-gray-300 p-2 rounded"
              rows={4}
            />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Code</h2>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 bg-gray-700 text-gray-300 font-mono p-2 rounded"
              placeholder="Enter your code here"
            />
          </div>

          {/* Add Run button and output display here */}
          <div className="mt-4">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600"
            >
              {isRunning ? 'Running...' : 'Run Code'}
            </button>

            {runError && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-400">
                {runError}
              </div>
            )}

            {output && !runError && (
              <div className="mt-4">
                <h3 className="text-xl font-semibold text-white mb-2">Output</h3>
                <pre className="bg-gray-900 p-4 rounded-lg text-gray-300 font-mono overflow-x-auto">
                  {output}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Template
            </button>
          </div>

          {/* ... existing run code section ... */}
        </div>
      </div>
    </div>
  );
}
