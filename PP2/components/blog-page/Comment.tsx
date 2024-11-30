import React, { MouseEventHandler, useContext, useEffect, useState } from 'react';
import { ThumbUp, ThumbDown } from '@mui/icons-material';
import { formatDistanceToNowStrict } from 'date-fns';
import { CommentWithReplies } from './CommentSection';
import { attemptRefresh, UserContext } from '@/context/UserContext';
import { useRouter } from 'next/router';

interface CommentProps {
  comment: CommentWithReplies, 
  commentType: "MAIN" | "ANCESTOR" | "BOTTOM", 
  onClick?: MouseEventHandler<HTMLDivElement>
  onDelete?: Function
}

export function Comment ({comment, commentType, onClick, onDelete}: CommentProps) {
  const [upvotes, setUpvotes] = useState(0)
  const [downvotes, setDownvotes] = useState(0)

  const { user, login, logout } = useContext(UserContext);
  const router = useRouter()

  useEffect(() => {
    setUpvotes(comment.upvotes)
    setDownvotes(comment.downvotes)
  }, [comment])

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
    comment.upvotes = upDated.upvotes
    comment.downvotes = upDated.downvotes
    setUpvotes(upDated.upvotes)
    setDownvotes(upDated.downvotes)
  }

  // Calculate the date relative to now
  const relativeTime = formatDistanceToNowStrict(comment.createdAt, { addSuffix: true });

  return (
    <div
      key={comment.id}
      className={`${
        commentType === "MAIN"
          ? 'bg-white p-6 rounded-lg shadow-md mb-6' // Main comment style
          : commentType === "BOTTOM"
          ? 'bg-gray-50 p-4 rounded-lg shadow-sm ml-6 mb-4' // Reply style
          : 'bg-gray-100 p-4 rounded-lg shadow-sm mb-4' // Ancestor style
      }`}
      onClick={onClick}
    >
      {/* Comment Content */}
      <div className="flex justify-between">
        <div className="space-y-2">
          <p className="text-gray-800 font-semibold">{comment.content}</p>
          <p className="text-gray-500 text-sm">{relativeTime}</p>
        </div>

        {/* Upvotes/Downvotes */}
        {user &&
        <div className="flex items-center space-x-2 text-gray-500">
          {comment.userId === user?.id && <button onClick={(e) => {
            e.stopPropagation()
            if (onDelete) {
              onDelete()
            }
          }}>delete</button>}
          <button className="flex items-center" onClick={(e) => {
            e.stopPropagation();
            handleVote("upvote")
          }}>
            <ThumbUp className="text" />
            <span className="ml-1">{upvotes}</span>
          </button>
          <button className="flex items-center" onClick={(e) => {
            e.stopPropagation();
            handleVote("downvote")
          }}>
            <ThumbDown className="text" />
            <span className="ml-1">{downvotes}</span>
          </button>
        </div>}
      </div>

    </div>
  );
};