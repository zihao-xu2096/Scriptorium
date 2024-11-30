import { NavBar } from '@/components/navigation/NavBar';
import { UserContext } from '@/context/UserContext';
import { refreshAccessToken } from '@/utils/refresh';
import { useRouter } from 'next/router';
import { useContext, useState } from 'react';


interface Template {
  id: string;
  title: string;
  explanation: string;
  language: string;
  code: string;
  author: {
    name: string;
  };
  authorId: string;
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

  const { user, login } = useContext(UserContext);

  const handleSubmit = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const authorId = payload.userId;
  
      const response = await fetch('/api/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title,
          explanation,
          language,
          code,
          authorId: user?.id,
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
        if (response.status === 400) {
          const error = await response.json();
          setRunError(error.error);
          return
        }
      }

      const data = await response.json();
      console.log(data)
      const templateId = data.template.id;
      // Redirect to the new template's page
      router.push(`/templateview/${templateId}`);
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
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Template Title*"
            className="w-full bg-gray-700 text-white text-3xl font-bold mb-4 p-2 rounded"
          />

          <div className="mb-6">
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Programming Language*"
              className="px-3 py-1 text-sm font-medium bg-gray-700 text-indigo-400 rounded-full"
            />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Description*</h2>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Enter template description"
              className="w-full bg-gray-700 text-gray-300 p-2 rounded"
              rows={4}
            />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Code*</h2>
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
    </>
  );
}
