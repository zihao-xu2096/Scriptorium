import { BlogPost } from "@/components/blog-page/BlogPost";
import { NavBar } from "@/components/navigation/NavBar";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function BlogDetail() {
  const router = useRouter();
  const [id, setId] = useState<number | null>(null);

  useEffect(() => {
    if (router.query.blogId && typeof(router.query.blogId) === "string") {
      setId(parseInt(router.query.blogId));
    }
  }, [router.isReady]);

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 text-gray-300 hover:text-white flex items-center transition-colors duration-200 group"
          >
            <span className="mr-2 text-lg font-medium group-hover:transform group-hover:-translate-x-1 transition-transform duration-200 flex items-center">←</span>
            <span className="font-medium flex items-center">Back to Posts</span>
          </button>
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            {router.isReady && id ? (
              <BlogPost id={id} />
            ) : (
              <div className="text-white">Loading...</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}