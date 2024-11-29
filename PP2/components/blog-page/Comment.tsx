import React, { MouseEventHandler, useEffect, useState } from 'react';
import { ThumbUp, ThumbDown, Reply } from '@mui/icons-material';
import { formatDistanceToNowStrict } from 'date-fns';
import { CommentWithReplies } from './CommentSection';

interface CommentProps {
  comment: CommentWithReplies, 
  commentType: "MAIN" | "ANCESTOR" | "BOTTOM", 
  onClick?: MouseEventHandler<HTMLDivElement>
}

export function Comment ({comment, commentType, onClick}: CommentProps) {

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
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="flex items-center" onClick={(e) => {
            e.stopPropagation();
          }}>
            <ThumbUp className="text-blue-500" />
            <span className="ml-1">{comment.upvotes}</span>
          </div>
          <div className="flex items-center" onClick={(e) => {
            e.stopPropagation();
          }}>
            <ThumbDown className="text-red-500" />
            <span className="ml-1">{comment.downvotes}</span>
          </div>
        </div>
      </div>

    </div>
  );
};