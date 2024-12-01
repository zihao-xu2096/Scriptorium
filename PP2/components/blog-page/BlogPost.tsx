import { Post } from '@prisma/client';
import { useContext, useEffect, useState } from "react";
import { RichTextEditor } from "../editor/Editor";
import { CommentSection } from "./CommentSection";
import { attemptRefresh, UserContext } from '@/context/UserContext';
import { ThumbUp, ThumbDown, Report, Send, Delete } from '@mui/icons-material';
import { useRouter } from 'next/router';

interface PostProps {
  id: number;
}

export interface PostWithDisplay extends Post {
  tags: {
    label: string;
  }[];
  createdBy: {
    firstName: string;
    lastName: string;
  };
  votes: {
    id: number;
    userId: number;
    voteType: string;
    postId: number;
  }[];
}

export const BlogPost = function ({ id }: PostProps) {
  const [post, setPost] = useState<PostWithDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, login, logout, loading: userLoading } = useContext(UserContext);
  const router = useRouter();
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);

  const handleVote = async (ratingType: "upvote" | "downvote") => {
    let accessToken = localStorage.getItem('accessToken');
    let response = await fetch(`/api/blog-posts/${id}/rate`, {
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
          response = await fetch(`/api/blog-posts/${id}/rate`, {
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
    };
    const updated = await response.json();
      setUpvotes(updated.upvotes);
      setDownvotes(updated.downvotes);
  }

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const fetchPost = async () => {
      try {
        let response = await fetch(`/api/blog-posts/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            //404
            setPost(null);
            return
          }
          console.log(response);
          return;
        }

        const results: PostWithDisplay = await response.json();
        setPost(results);
        setUpvotes(results.upvotes)
        setDownvotes(results.downvotes)
        console.log(results);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  return (
    loading || userLoading ? <h1>loading</h1> :
    <>
      {post ? 
      <>
        <div className="container mx-auto p-6">
        {/* Blog Post */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{post.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{post.description}</p>
          <RichTextEditor post={post} readOnly={true} initialValue={JSON.parse(post.content)} />
          </div>
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
        </div>
        <CommentSection blogId={id} />
      </> : 
      <>
      <h1>Post Not Found</h1>
      </>}
    </>
  )
}