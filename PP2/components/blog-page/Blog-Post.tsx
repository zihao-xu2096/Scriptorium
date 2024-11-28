import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Post } from '@prisma/client';
import { Editor } from "slate";
import { RichTextEditor } from "../editor/Editor";

interface PostProps {
  id: number
}


export const BlogPost = function ({id}: PostProps) {
  const [post, setPost] = useState<Post | null>(null);
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
  
      
        const results: Post = await response.json();
        console.log(results)
        setPost(results);
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
        <h1>{post.title}</h1>
        <RichTextEditor readOnly={true} initialValue={JSON.parse(post.content)} />
      </> : 
      <>
      <h1>Post Not Found</h1>
      </>}
    </>
  )
}