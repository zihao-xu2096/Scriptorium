import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Post } from '@prisma/client';
import { Editor } from "slate";
import { RichTextEditor } from "../editor/Editor";
import Link from "next/link";
import { CommentSection } from "./CommentSection";

interface PostProps {
  id: number
}

interface PostWithDisplay extends Post {
  tags: {
      label: string;
  }[],
  createdBy: {
    firstName: string;
    lastName: string;
  }, votes: {
    id: number;
    userId: number;
    voteType: string;
    postId: number;
  }[];
}

export const BlogPost = function ({id}: PostProps) {
  const [post, setPost] = useState<PostWithDisplay | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect((() => {

    const accessToken = localStorage.getItem('accessToken');
    const fetchCodeTemplates = async () => {
      try {
        let response = await fetch(`/api/blog-posts/${id}`, {
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
        
        const results: PostWithDisplay = await response.json();
        setPost(results);
        console.log(results)
      } catch (error) {
        console.error(error);
      }
    };  

    fetchCodeTemplates();
  }), []);

  return (
    loading ? <h1>loading</h1> :
    <>
      {post ? 
      <>
        <div className="container mx-auto p-6">
        {/* Blog Post */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{post.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{post.description}</p>
          <RichTextEditor readOnly={false} initialValue={JSON.parse(post.content)} />
          </div>
        </div>
        <CommentSection />
      </> : 
      <>
      <h1>Post Not Found</h1>
      </>}
    </>
  )
}