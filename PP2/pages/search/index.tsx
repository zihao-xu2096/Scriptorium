import { useEffect } from 'react';
import { useRouter } from 'next/router';
import SearchTemplates from '@/components/search/SearchTemplates';
import { NavBar } from '@/components/navigation/NavBar';
import { SearchPosts } from '@/components/search/SearchPosts';
import { Tabs } from '@mantine/core';

export default function SearchIndex() {
  
  return (
    <>
    <NavBar />
    <Tabs defaultValue="templates">
    <div className='pt-10 w-full m-auto flex bg-gray-900'>
      <Tabs.List className="rounded-xl flex m-auto w-full max-w-3xl  space-x-0 gap-1">
          {/* Tab 1: Templates */}
          <Tabs.Tab
            value="templates"
            className="grow bg-rose-600/30 border-rose-800/50 text-base rounded-tl-lg rounded-bl-lg py-3 text-base text-white cursor-pointer hover:bg-rose-800/50 focus:bg-gray-700/50 focus:text-white transition-all text-center"
          >
            Templates
          </Tabs.Tab>

          {/* Tab 2: Blog Posts */}
          <Tabs.Tab
            value="blog-posts"
            className="grow bg-rose-600/30 border-rose-800/50 text-base rounded-tr-lg rounded-br-lg py-3 text-base text-white cursor-pointer hover:bg-rose-800/50 focus:bg-gray-700/50 focus:text-white transition-all text-center"
          >
            Blog Posts
          </Tabs.Tab>
        </Tabs.List> 
    </div>
      

    <Tabs.Panel value='templates'>
      <SearchTemplates />
    </Tabs.Panel>
    <Tabs.Panel value='blog-posts'>
      <SearchPosts />
    </Tabs.Panel>
    </Tabs>
    </>
  )
}