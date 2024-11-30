import { Post } from '@prisma/client';
import { useEffect, useState } from "react";
import { RichTextEditor } from "../editor/Editor";
import { CommentSection } from "./CommentSection";

interface PostProps {
  id: number;
}

interface PostWithDisplay extends Post {
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
        console.log(results);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCodeTemplates();
  }, [id]);

  return (
    loading ? <h1 className="text-gray-800">Loading...</h1> :
      <>
        {post ?
          <>
            <div className="container mx-auto p-6">
              {/* Blog Post */}
              <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-300">
                <h1 className="text-3xl font-bold text-gray-800">{post.title}</h1>
                <p className="text-gray-600 mt-2">{post.description}</p>
                <RichTextEditor readOnly={false} initialValue={JSON.parse(post.content)} />
              </div>
            </div>
            <CommentSection blogId={id} />
          </> :
          <>
            <h1 className="text-gray-800">Post Not Found</h1>
          </>}
      </>
  );
};