import { BlogPost } from "@/components/blog-page/Blog-Post";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";


export default function() {
  const router = useRouter();
  const [id, setId] = useState<number | null>(null);
  console.log(router)

  useEffect(() => {
    if (router.query.blogId && typeof(router.query.blogId) === "string") {
      setId(parseInt(router.query.blogId));
    }
  }, [router.isReady])

  return router.isReady && id ? <BlogPost id={id}/> : <h1>loading</h1>
}