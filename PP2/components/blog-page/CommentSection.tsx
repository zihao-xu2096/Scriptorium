import { Comment } from '@prisma/client';
import { formatDistanceToNowStrict } from 'date-fns';
import { useContext, useEffect, useState } from 'react';
import { Comment as CommentElement } from './Comment';
import { attemptRefresh, UserContext } from '@/context/UserContext';
import { useRouter } from 'next/router';

interface CommentSectionProps {
  blogId: number;
}

export interface CommentWithReplies extends Comment {
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
  const [mainComment, setMainComment] = useState<CommentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [pageNum, setPageNum] = useState<number>(1); // Default to 1
  const [pageCount, setPageCount] = useState<number | null>(null);
  const { user, login, logout } = useContext(UserContext)
  const [history, setHistory] = useState<CommentState[]>([]); // Track ancestors
  const router = useRouter()

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
        setPageCount(Math.ceil(results.count / 5));
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchComments();
  }, [mainComment, pageNum, blogId]); // Dependencies include `blogId` to re-fetch when it changes

  const handleBackClick = () => {
    // Go back to the previous comment level (pop the last comment from history)
    if (history.length == 0) {
      setPageNum(mainComment?.pageNumber || 1);
      setMainComment(null);
      return;
    }
    const previousHistory = [...history];
    const lastComment = previousHistory.pop();

    setHistory(previousHistory);
    setMainComment(lastComment || null);
    setPageNum(mainComment?.pageNumber || 1); // Reset to page 1 when going back
  };

  const handleDelete = async (postId: number, commentId: number) => {
    let accessToken = localStorage.getItem('accessToken');
    let response = await fetch(`/api/blog-posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        const refreshed = await attemptRefresh();
        if (refreshed) {
          accessToken = localStorage.getItem('accessToken');
          login(refreshed);
          response = await fetch(`/api/blog-posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            //set the error
            return;
          }
        } else {
          logout();
          router.push("/unauthorized");
          return;
        }
      } else {
        //set error
      }
    }
    
    const upDated = await response.json()
    console.log(upDated)
  }

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
      setPageCount(Math.ceil(results.count / 5));
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
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
        setPageCount(Math.ceil(results.count / 5));
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    // Handle submitting a new comment
    if (!newComment.trim()) return;

    let accessToken = localStorage.getItem('accessToken');
    let response = await fetch(`/api/blog-posts/${blogId}/comments`, {
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

    if (!response.ok) {
      if (response.status === 401) {
        const refreshed = await attemptRefresh();
        if (refreshed) {
          accessToken = localStorage.getItem('accessToken');
          login(refreshed);
          response = await fetch(`/api/blog-posts/${blogId}/comments`, {
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

          if (!response.ok) {
            //set the error
            return;
          }
        } else {
          logout();
          router.push("/unauthorized");
          return;
        }
      } else {
        //set error
      }
    }

    fetchComments();
    setPageNum(1);
    setNewComment('');
  };

  const renderComments = () => {
    return (
      <div className="space-y-4">
        {comments.map((reply, index) => 
          <CommentElement key={index} comment={reply} commentType='BOTTOM' onClick={() => {
            setComments([])
            if (mainComment) {
              setHistory([...history, { ...mainComment, pageNumber: pageNum }]);
            }
            setMainComment({...reply, pageNumber: pageNum});
            setPageNum(1); // Always reset to page 1 when diving into replies
          }} onDelete={async () => {
            await handleDelete(reply.postId, reply.id)
            fetchComments()
          }}/>
        )}
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
                <CommentElement key={index} comment={ancestor} commentType='ANCESTOR' />
              ))}
            </div>
          )}

          {mainComment && (
            <CommentElement comment={mainComment} commentType='MAIN' onDelete={
              async () => {
                await handleDelete(mainComment.postId, mainComment.id)
                if (history.length == 0) {
                  setPageNum(1); 
                  setMainComment(null);
                  return;
                }
                const previousHistory = [...history];
                const lastComment = previousHistory.pop();

                setHistory(previousHistory);
                setMainComment(lastComment || null);
                setPageNum(1); // Reset to page 1 when going back
              }
            } />
          )}

          {renderComments()}

          {user &&
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
          </div>}

          {pageCount && pageCount > 1 ? (
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
          ) : <></>}
        </>
      )}
    </div>
  );
};
