
import { NavBar } from '@/components/navigation/NavBar';
import { TagsInput } from '@mantine/core';
import { useRouter } from 'next/router';

import React, { useCallback, useContext, useRef, useState } from 'react'
import isHotkey from 'is-hotkey'
import { Editable, withReact, useSlate, Slate, RenderElementProps, RenderLeafProps, ReactEditor, useFocused } from 'slate-react'
import {
  BaseEditor,
  Editor,
  Transforms,
  createEditor,
  Descendant,
  Element as SlateElement,
  BaseRange,
  Range,
  Node,
} from 'slate'
import { withHistory, HistoryEditor } from 'slate-history'
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import CodeIcon from '@mui/icons-material/Code';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import InsertLinkIcon from '@mui/icons-material/InsertLink';

import Link from 'next/link'
import { LinkModal } from '@/components/editor/LinkModal'
import { Button } from '@/components/editor/Button'
import { Post } from '@prisma/client';
import { attemptRefresh, UserContext } from '@/context/UserContext'
import '@mantine/core/styles.layer.css'

interface Options {
  [key: string]: string;
}

export interface PostWithDisplay extends Post {
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


export default function BlogPost() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { user, login, logout } = useContext(UserContext);
  const [tags, setTags] = useState<string[]>();

  const handleSubmit = async () => {

    let accessToken = localStorage.getItem('accessToken');
    const data = {
      title: title,
      description: description || undefined,
      tags: tags
    }

    console.log(data)

    let response = await fetch('/api/blog-posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });
    let post;

    if (!response.ok) {
      if (response.status === 401) {
        const refreshed = await attemptRefresh();
        if (refreshed) {
          accessToken = localStorage.getItem('accessToken');
          login(refreshed);
    
          const response = await fetch('/api/blog-posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            //set the error
            return;
          } else {
            post = await response.json();
          }
        } else {
          logout();
          router.push("/login");
          return;
        }
      } else {
        //set error
      }
    } 
    post = await response.json()
    console.log(post)
    router.push(`/blogs/${post.id}/edit`)
  };

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title*"
            className="w-full bg-gray-700 text-white text-3xl font-bold mb-4 p-2 rounded"
          />


          {/* Set Tags */}
          <div className="flex mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Tags</h2>
            <TagsInput label="Press enter to submit a tag" className="flex-1 p-3 bg-gray-800 border-gray-700 
              placeholder-gray-400 rounded-lg shadow-sm 
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              onChange={(value) => {
                setTags(value);
              }} 
              clearable />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Description</h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="w-full bg-gray-700 text-gray-300 p-2 rounded"
              rows={4}
            />
          </div>

          
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Post
            </button>
          </div>

        </div>
      </div>
      </>
  );
} 



