import { Comment } from '@prisma/client';
import { formatDistanceToNowStrict } from 'date-fns';
import { useEffect, useState } from 'react';

interface CommentSectionProps {
  blogId: number;
}

interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
  _count: {
    replies: number;
  };
}

interface CountedComments {
  comments: CommentWithReplies[];
  count: number;
}

interface CommentState extends CommentWithReplies {
  pageNumber: number;
}

export const CommentSection = ({ blogId }: CommentSectionProps) => {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [mainComment, setMainComment] = useState<CommentWithReplies | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [pageNum, setPageNum] = useState<number>(1); // Default to 1
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [history, setHistory] = useState<CommentState[]>([]); // Track ancestors

  useEffect(() => {
    const fetchComments = async () => {
      const accessToken = localStorage.getItem('accessToken');
      try {
        const response = await fetch(`/api/blog-posts/${blogId}/comments?limit=5&page=${pageNum}${mainComment ? `&parentId=${mainComment.id}` : ''}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          console.log(response);
          setLoading(false);
          return;
        }

        const results: CountedComments = await response.json();
        setComments(results.comments);
        setPageCount(results.count / 5);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchComments();
  }, [mainComment, pageNum, blogId]); // Dependencies include `blogId` to re-fetch when it changes

  const formatRelativeTime = (dateString: string) => {
    return formatDistanceToNowStrict(new Date(dateString), { addSuffix: true });
  };

  const handleBackClick = () => {
    // Go back to the previous comment level (pop the last comment from history)
    if (history.length == 0) {
      setMainComment(null);
      return;
    }
    const previousHistory = [...history];
    const lastComment = previousHistory.pop();

    setHistory(previousHistory);
    setMainComment(lastComment || null);
    setPageNum(lastComment?.pageNumber || 1); // Reset to page 1 when going back
  };

  const handleCommentSubmit = async () => {
    // Handle submitting a new comment
    if (!newComment.trim()) return;

    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`/api/blog-posts/${blogId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: newComment,
        parent: mainComment?.id,
      }),
    });

    if (response.ok) {
      setNewComment('');
    } else {
      console.error('Failed to submit comment');
    }
  };

  const renderComments = () => {
    return (
      <div className="space-y-4">
        {comments.map((reply) => (
          <div
            key={reply.id}
            className="space-y-2"
            onClick={() => {
              if (mainComment) {
                setHistory([...history, { ...mainComment, pageNumber: pageNum }]);
              }
              setMainComment(reply);
              setPageNum(1); // Always reset to page 1 when diving into replies
            }}
          >
            <div className="bg-gray-500 p-4 rounded-lg shadow-sm hover:bg-gray-600 my-2 cursor-pointer transition-all duration-300">
              <p>{reply.content}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold mb-6 text-gray-800">Comments</h3>

      {mainComment && (
        <button
          onClick={handleBackClick}
          className="bg-gray-200 px-4 py-2 rounded-md text-sm text-blue-600 hover:bg-gray-300 mb-6"
        >
          Back
        </button>
      )}

      {loading ? (
        <p className="text-center text-gray-500">Loading comments...</p>
      ) : (
        <>
          {history.length > 0 && (
            <div className="space-y-4 mb-6">
              {history.map((ancestor, index) => (
                <div key={ancestor.id} className="bg-gray-500 p-3 rounded-md">
                  <div>{ancestor.content}</div>
                </div>
              ))}
            </div>
          )}

          {mainComment && (
            <div className="bg-gray-400 p-4 rounded-md shadow-sm mb-6">
              <div className="space-y-2">
                <div className="bg-gray-500 p-3 rounded-md">
                  <p>{mainComment.content}</p>
                </div>
              </div>
            </div>
          )}

          {renderComments()}

          <div className="bg-gray-500 p-4 rounded-md shadow-sm">
            <h4 className="font-semibold text-lg mb-4">{mainComment ? 'Reply to Comment' : 'Write a comment'}</h4>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your reply..."
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCommentSubmit}
              className="bg-blue-500 text-white px-6 py-2 rounded-md mt-4 hover:bg-blue-600 transition duration-200"
            >
              Submit
            </button>
          </div>

          {pageCount && pageCount > 1 && (
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setPageNum((prev) => Math.max(1, prev - 1))}
                disabled={pageNum === 1}
                className="bg-gray-200 px-6 py-2 rounded-md text-sm text-blue-600 hover:bg-gray-300 disabled:bg-gray-300"
              >
                Previous
              </button>
              <button
                onClick={() => setPageNum((prev) => Math.min(pageCount, prev + 1))}
                disabled={pageNum === pageCount}
                className="bg-gray-200 px-6 py-2 rounded-md text-sm text-blue-600 hover:bg-gray-300 disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
