import { refreshAccessToken } from '@/utils/refresh';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getAuthorName } from 'utils/authors';

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

interface Tag {
  id: string;
  name: string;
}

export default function TemplateDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [currentUserID, setCurrentUserID] = useState<number | null>(null);

  useEffect(() => {
    fetchCurrentUserID();
  }, [])

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);
  useEffect(() => {
    if (template) {
      setEditedCode(template.code);
    }
  }, [template]);

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

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/template?id=${id}`);
      if (!response.ok) {
        throw new Error('Template not found');
      }

      const templates = await response.json();

      if (!Array.isArray(templates) || templates.length === 0) {
        throw new Error('Template not found');
      }

      const templateData = templates[0];
      const authorName = await getAuthorName(templateData.authorId);

      const tagNames = templateData.tags?.map((tag: Tag) => tag.name) || [];

      setTemplate({
        ...templateData,
        author: authorName,
        tags: tagNames
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    } finally {
      setLoading(false);
    }

  };

  const handleSave = async () => {
    try {
      if (!template) {
        throw new Error('Template not found');
      }
      if (Number(template.authorId) !== Number(currentUserID)) {
        handleFork();
        return;
      }
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`/api/template/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: template.title,
          explanation: template.explanation,
          language: template.language,
          code: editedCode,
          // tags: template.tags
        }),
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

      setIsEditing(false);
      // Refresh the template data
      fetchTemplate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
    }
  };

  //if the user needs to fork
  const handleFork = async () => {
    try {
      if (!template) {
        throw new Error('Template not found');
      }
      const data = {
        title: template.title,
        explanation: template.explanation,
        language: template.language,
        code: editedCode,
        authorId: currentUserID,
        tags: template.tags,
        parentId: template.id
      }

      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`/api/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newTemplate = await response.json();
        if (confirm("Successfully forked! Would you like to go to your new forked template?")) {
          router.push(`/templateview/${newTemplate.template.id}`);
        }
      } else {
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

      setIsEditing(false);
      // Refresh the template data
      fetchTemplate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setRunError(null);
    setOutput('');

    // Get the current code
    const currentCode = isEditing ? editedCode : template?.code;
    if (!currentCode || !template?.language) {
      setRunError('Code or language is missing');
      setIsRunning(false);
      return;
    }
    const normalizedLanguage = template?.language.toLowerCase().replace('c++', 'cpp');

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: normalizedLanguage,
          code: currentCode,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  if (error || !template) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500">{error || 'Template not found'}</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push('/search')}
          className="mb-4 px-4 py-2 text-gray-300 hover:text-white flex items-center transition-colors duration-200 group"
        >
          <span className="mr-2 text-lg font-medium group-hover:transform group-hover:-translate-x-1 transition-transform duration-200 flex items-center">←</span>
          <span className="font-medium flex items-center">Back to Search</span>
        </button>
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-4">{template.title}</h1>
          <div className="mb-2">
            <span>tags : </span>
            {template.tags.map((tag: String) => (
              <span 
              key={tag.toString()}
              className="px-3 py-1 mr-1 text-sm font-medium text-green-400 
              bg-green-900 rounded-full"
            >
              {tag}
            </span>
            ))}
          </div>
          <div className="mb-6">
            <span>language : </span>
            <span className="px-3 py-1 text-sm font-medium text-indigo-400 
                          bg-indigo-900 rounded-full">
              {template.language}
            </span>
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Description</h2>
            <p className="text-gray-400">{template.explanation}</p>
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-4">Code</h2>
            {isEditing ? (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {Number(template.authorId) === Number(currentUserID) ? 'Save' : 'Save and Fork'}
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
            )}
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            {isEditing ? (
              <textarea
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)}
                className="w-full h-64 bg-gray-800 text-gray-300 font-mono p-2 rounded"
              />
            ) : (
              <pre className="overflow-x-auto">
                <code className="text-gray-300">{template.code}</code>
              </pre>
            )}
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

          <div className="mt-4 text-gray-400">
            Created by {template.author || 'Unknown Author'}
          </div>
          {template.parentId && (
            <div className="mt-4 text-gray-400">
              <span>Forked from </span>
              <button
                onClick={() => router.push(`/templateview/${template.parentId}`)}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                parent template →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
