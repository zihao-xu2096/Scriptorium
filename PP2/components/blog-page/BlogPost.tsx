import { Post } from '@prisma/client';
import { useContext, useEffect, useState } from "react";
import { RichTextEditor } from "../editor/Editor";
import { CommentSection } from "./CommentSection";
import { UserContext } from '@/context/UserContext';

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
  const { user, loading: userLoading } = useContext(UserContext);

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
        </div>
        <CommentSection blogId={id} />
      </> : 
      <>
      <h1>Post Not Found</h1>
      </>}
    </>
  )
}