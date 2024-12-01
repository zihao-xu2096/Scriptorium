import React, { MouseEventHandler, useContext, useEffect, useState } from 'react';
import { ThumbUp, ThumbDown, Report, Send, Delete,  VisibilityOff } from '@mui/icons-material';
import { formatDistanceToNowStrict } from 'date-fns';
import { CommentWithReplies } from './CommentSection';
import { attemptRefresh, UserContext } from '@/context/UserContext';
import { useRouter } from 'next/router';

interface CommentProps {
  comment: CommentWithReplies; 
  commentType: "MAIN" | "ANCESTOR" | "BOTTOM"; 
  onClick?: MouseEventHandler<HTMLDivElement>;
  onDelete?: Function;
  onReport?: Function; // Callback for reporting
}

export function Comment({ comment, commentType, onClick, onDelete }: CommentProps) {
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportExplanation, setReportExplanation] = useState('');
  const [sortingOption, setSortingOption] = useState('default'); // default sorting
  const [isHidden, setIsHidden] = useState(false);

  const { user, login, logout } = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    setUpvotes(comment.upvotes);
    setDownvotes(comment.downvotes);
  }, [comment]);

  const handleVote = async (ratingType: "upvote" | "downvote") => {
    let accessToken = localStorage.getItem('accessToken');
    let response = await fetch(`/api/blog-posts/${comment.postId}/comments/${comment.id}/rate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ratingType
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        const refreshed = await attemptRefresh();
        if (refreshed) {
          accessToken = localStorage.getItem('accessToken');
          login(refreshed);
          response = await fetch(`/api/blog-posts/${comment.postId}/comments/${comment.id}/rate`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ratingType
            }),
          });

          if (!response.ok) {
            // Handle error
            return;
          }
        } else {
          logout();
          router.push("/login");
          return;
        }
      } else {
        // Handle error
      }
    }}

    const handleHide = async () => {
      let accessToken = localStorage.getItem('accessToken');
      let response = await fetch(`/api/blog-posts/${comment.postId}/comments/${comment.id}/hide`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          const refreshed = await attemptRefresh();
          if (refreshed) {
            accessToken = localStorage.getItem('accessToken');
            login(refreshed);
            response = await fetch(`/api/blog-posts/${comment.postId}/comments/${comment.id}/hide`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                explanation: reportExplanation
              }),
            });
  
            if (!response.ok) {
              // Handle error
              return;
            }
          } else {
            logout();
            router.push("/login");
            return;
          }
        } else {
          // Handle error
        }
      }

    const updated = await response.json();
    console.log(updated);
    setIsHidden(updated.isHidden)
  };

    
    const onReport = async () => {
      let accessToken = localStorage.getItem('accessToken');
      let response = await fetch(`/api/blog-posts/${comment.postId}/comments/${comment.id}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          explanation: reportExplanation
        }),
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          const refreshed = await attemptRefresh();
          if (refreshed) {
            accessToken = localStorage.getItem('accessToken');
            login(refreshed);
            response = await fetch(`/api/blog-posts/${comment.postId}/comments/${comment.id}/report`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                explanation: reportExplanation
              }),
            });
  
            if (!response.ok) {
              // Handle error
              return;
            }
          } else {
            logout();
            router.push("/login");
            return;
          }
        } else {
          // Handle error
        }
      }

    const updated = await response.json();
    comment.upvotes = updated.upvotes;
    comment.downvotes = updated.downvotes;
    setUpvotes(updated.upvotes);
    setDownvotes(updated.downvotes);
  };

  // Report the comment
  const handleReport = () => {
    if (onReport) {
      onReport(); // Call the parent component's callback
    }
    setIsReportModalOpen(false); // Close the report modal after submitting
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from propagating to the parent comment
  };

  const handleOutsideModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsReportModalOpen(false); // Close the modal if clicked outside
    }
  };

  // Calculate the date relative to now
  const relativeTime = formatDistanceToNowStrict(comment.createdAt, { addSuffix: true });

  return (
    <div
      key={comment.id}
      className={`${
        commentType === "MAIN"
          ? 'bg-white p-6 rounded-lg shadow-md mb-6'
          : commentType === "BOTTOM"
          ? 'bg-gray-50 p-4 rounded-lg shadow-sm ml-6 mb-4'
          : 'bg-gray-100 p-4 rounded-lg shadow-sm mb-4'
      }`}
      onClick={onClick}
    >
      {/* Comment Content */}
      <div className="flex justify-between">
        <div className="space-y-2">
          <p className="text-gray-800 font-semibold">{comment.content}</p>
          <p className="text-gray-500 text-sm">By {comment.createdBy.firstName + " " + comment.createdBy.lastName} • {relativeTime}</p>
        </div>

        {/* Upvotes/Downvotes */}
        {user && (
          <div className="flex items-center space-x-2 text-gray-500">
            {comment.userId === user?.id && commentType !== "ANCESTOR" && (
                <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDelete) {
                    onDelete();
                  }
                }}
                className="text-red-500 hover:text-red-700"
              >
                
                <Delete className="text-gray-500 hover:text-gray-700" /> {/* Delete icon */}
              </button>
            )}
            <button className="flex items-center" onClick={(e) => {
              e.stopPropagation();
              handleVote("upvote");
            }}>
              <ThumbUp className="text-gray-500" />
              <span className="ml-1">{upvotes}</span>
            </button>
            <button className="flex items-center" onClick={(e) => {
              e.stopPropagation();
              handleVote("downvote");
            }}>
              <ThumbDown className="text-gray-500" />
              <span className="ml-1">{downvotes}</span>
            </button>

            {/* Report button (visible only for logged-in users) */}
            <button
              className="flex items-center text-yellow-500 hover:text-yellow-700"
              onClick={(e) => {
                e.stopPropagation();
                setIsReportModalOpen(true);
              }}
            >
              <Report />
            </button>
            {/* Admin Hide Button */}
            {user.userType === 'ADMIN' && !comment.isHidden && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleHide();
                }}
                className={`flex items-center ${comment.isHidden ? 'text-yellow-500' : 'text-gray-500'} hover:text-yellow-700`}
              >
                 <VisibilityOff />
              </button>
            )}
          </div>
        )}
      </div>

      

      {/* Report Modal (conditional rendering) */}
      {isReportModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
          onClick={handleOutsideModalClick} // Handle clicks outside the modal to close it
        >
          <div
            className="bg-white p-6 rounded-lg shadow-md w-96"
            onClick={handleModalClick} // Stop propagation if clicking inside the modal
          >
            <h3 className="text-lg font-semibold mb-4">Report Comment</h3>
            <textarea
              className="w-full p-2 border rounded mb-4"
              placeholder="Provide a reason for reporting this comment..."
              value={reportExplanation}
              onChange={(e) => setReportExplanation(e.target.value)}
            />
            <div className="flex justify-between">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                <Send />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
