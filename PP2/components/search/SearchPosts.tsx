import { Autocomplete, AutocompleteProps, ComboboxLikeRenderOptionInput, ComboboxStringData, ComboboxStringItem, TagsInput } from '@mantine/core';
import { CodeTemplate, Post } from '@prisma/client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState, FormEvent, forwardRef, KeyboardEvent, MouseEvent, } from 'react';
import '@mantine/core/styles.layer.css'

interface PostWithTags extends Post  {
  tags: {
    label: string
  }[],
  createdBy: {
      firstName: string,
      lastName: string
  }
}

interface TemplateWithTags extends CodeTemplate  {
  tags: {
    name: string;
    id: number;
    createdAt: Date;
    updatedAt: Date;
}[],
author: {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
};
}


interface CountedPosts {
  posts: PostWithTags[]
  count: number
}

const ITEMS_PER_PAGE = 21; 

export function SearchPosts() {
  const [posts, setPosts] = useState<PostWithTags[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [searchTerm, setSearchTerm] = useState('title');
  const [searchValue, setSearchvalue] = useState('');
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<Record<string, {title: string, explanation: string, tags: string[], author: string}>>({});
  const [templateIds, setTemplateIds] = useState([])
  const [templateSearch, setTemplateSearch] = useState('');

  const router = useRouter();

  
  const renderOption: AutocompleteProps['renderOption'] = ({option}) => {
    return (
      <div className="flex items-center p-3 border-b hover:bg-gray-100 cursor-pointer">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{templates[option.value].title || "No Title"}</h3>
          <p className="text-sm text-gray-600">{templates[option.value].explanation || ""}</p>
          <div className="mt-1 text-xs text-gray-500">
            <span className="font-semibold">Tags:</span> {templates[option.value].tags.join(', ') || "[no tags]"}
          </div>
          <div className="text-xs text-gray-500">Author: {templates[option.value].author}</div>
        </div>
      </div>
    );
  };


  const fetchPosts = async () => {
    const accessToken = localStorage.getItem('accessToken');
    try {
      if (searchTerm.toLowerCase() !== "title" &&
        searchTerm.toLowerCase() !== "content" &&
        searchTerm.toLowerCase() !== "tags" &&
        searchTerm.toLowerCase() !== "template") {
        
      }
      const response = await fetch(`/api/blog-posts${searchValue ? "?" : ""}${searchValue ? searchTerm + "=" + searchValue : ""}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.log(response);
        return;
      }

      const results: CountedPosts = await response.json();
      setPosts(results.posts);
      setPageCount(Math.ceil(results.count / ITEMS_PER_PAGE));
    } catch (error) {
      console.error(error);
    }
  };

  
  const fetchTemplates = async () => {
    const accessToken = localStorage.getItem('accessToken');
    try {
      const response = await fetch(`/api/template?title=${templateSearch}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.log(response);
        return;
      }

      const results = await response.json();
      console.log(results)
      setTemplateIds(results.map((template: TemplateWithTags) => template.id.toString()));
      setTemplates(results.reduce((prev: Record<string, {title: string, explanation: string, tags: string[], author: string}>, cur: TemplateWithTags) => {
        prev[cur.id.toString()] = {
          title: cur.title,
          explanation: cur.explanation,
          tags: cur.tags.map((tag) => tag.name),
          author: cur.author.firstName + " " + cur.author.lastName
        } 
        return prev
      }, {}))
      
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      const accessToken = localStorage.getItem('accessToken');
      try {
        const response = await fetch(`/api/blog-posts${searchValue ? `?${searchTerm}=${searchValue}` : ""}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          console.log(response);
          return;
        }

        const results: CountedPosts = await response.json();
        setPosts(results.posts);
        setPageCount(Math.ceil(results.count / ITEMS_PER_PAGE));
      } catch (error) {
        console.error(error);
      }
    };

    fetchPosts();
  }, [pageNum]); // Dependencies include `blogId` to re-fetch when it changes


  return (
    <>
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 px-4 py-2 text-gray-300 hover:text-white flex items-center transition-colors duration-200 group"
        >
          <span className="mr-2 text-lg font-medium group-hover:transform group-hover:-translate-x-1 transition-transform duration-200 flex items-center">←</span>
          <span className="font-medium flex items-center">Back </span>
        </button>

        <h1 className="text-3xl font-bold text-white mb-6">Find Posts</h1>

        {/* Search Form */}
        <form onSubmit={(e) => {
          e.preventDefault();
          fetchPosts()
        }} className="flex gap-4 mb-8">
          <select
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setSearchvalue('');
            }}
            
            className="p-3 bg-gray-800 border-gray-700 rounded-lg"  // Added text-white
          >
            <option value="title" className="text-white">Title</option>
            <option value="content" className="text-white">Content</option>
            <option value="tags" className="text-white">Tags</option>
            <option value="template" className="text-white">Template</option>
          </select>
          {
            searchTerm.toLowerCase() === "tags" ?
              <TagsInput label="Press enter to submit a tag" className="flex-1 p-3 bg-gray-800 border-gray-700 
              placeholder-gray-400 rounded-lg shadow-sm 
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              onChange={(value) => {
                setSearchvalue(value.join(','));
              }} 
              clearable
              /> : 
            (
            searchTerm.toLowerCase() === "template" ? 
              <>
              <Autocomplete className="flex-1 py-3 border-gray-700
                placeholder-gray-400 rounded-lg text-black
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                data={templateIds} renderOption={renderOption} value={templateSearch} onSelect={fetchTemplates} onChange={
                  (value) => setTemplateSearch(value)
                  } />
              </> : 
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchvalue(e.target.value)}
                placeholder={`Search by ${searchTerm}`}
                className="flex-1 p-3 bg-gray-800 border-gray-700 text-white 
                placeholder-gray-400 rounded-lg shadow-sm 
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />)
          }
          
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg 
                   hover:bg-indigo-700 focus:outline-none focus:ring-2 
                   focus:ring-offset-2 focus:ring-indigo-500 
                   focus:ring-offset-gray-900" // Added offset color
            onClick={fetchPosts}
          >
            Search
          </button>
        </form>
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Search</h2>
          </div>
          {posts.length <= 0 ?
           <> 
           <div className="flex justify-center items-center mb-4">
            <h2 className="text-2xl font-bold text-white">No posts found</h2>
          </div>
           </>: 
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blogs/${post.id}`}
                className="block"
              >
                <div
                  key={post.id}
                  className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:scale-[1.02] 
                  transform transition-all duration-300 border border-gray-700 
                  flex flex-col h-full"
                >
                  {/* Template Image */}
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src="/background/wave.jpg"
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  {/* Template Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      {/* Updated text colors */}
                      <h3 className="text-lg font-semibold text-white">
                        {post.title}
                      </h3>
                    </div>

                    {/* Updated description color */}
                    <p className="text-gray-400 text-sm mb-4">
                      {post.description}
                    </p>
                    <div className="mb-2 flex flex-wrap gap-1">
                      <span className="text-gray-300">tags : </span>
                      {post.tags.length > 0 ? post.tags.map((tag, index: number) => (
                        <span
                          key={`${post.id}-${tag.label}-${index}`}
                          className="px-3 py-0.5 my-0.5 text-sm font-medium text-green-400 bg-green-900 rounded-full"
                        >
                          {tag.label}
                        </span>
                      )) : "[no tags]"}
                    </div>
                    <div className="flex items-center justify-between">
                      {/* Updated stats color */}
                      <span className="text-sm text-gray-500">
                        By {post.createdBy.firstName + " " + post.createdBy.lastName}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>}
        </div>

        {/* Add pagination controls */}
        { pageCount > 0 &&
        <div className="my-8 flex justify-center gap-2">
          <button
            onClick={() => setPageNum(Math.max(pageNum - 1, 1))}
            disabled={pageNum <= 1}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
          >
            Previous
          </button>

          
          <span className="px-4 py-2 text-white">
            Page {pageNum} of {pageCount}
          </span>

          <button
            onClick={() => setPageNum(Math.min(pageNum + 1, pageCount))}
            disabled={pageNum >= pageCount}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>}
      </div>
    </div>
    
    </>
  )
}



