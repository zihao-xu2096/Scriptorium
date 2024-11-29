import { prisma } from '@/prisma/prisma';

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { protectedRoute } from "@/middleware/auth";
import { ApiError, ExtendedRequest, isExtended } from '@/new-types';
import { NextApiRequest, NextApiResponse } from 'next';
import { Comment } from '@prisma/client';
import { comment } from 'postcss';

type BlogPostQuery = {
  postId?: string
}

type CreateCommentBody = {
  content: string
  parent?: string
}

type GetBlogPostsQuery = {
  page?: string | number
  limit?: string | number
  sortBy?: string
  parentId?: string
}

type CountedComments = {
  comments: Comment[]
  count: number
}

async function handler(req: ExtendedRequest | NextApiRequest, res: NextApiResponse<Comment | CountedComments | ApiError>) {
  if (req.method === "POST") {
    //creating a comment
    const { content, parent }: CreateCommentBody = req.body;
    const { postId }: BlogPostQuery = req.query;

    if (!isExtended(req)) {
      res.status(401).json({ message: "No user found" });
      return;
    } 

    if (!postId) {
      res.status(400).json({ message: "Blog ID not provided" })
      return;
    }

    if (!parseInt(postId)) {
      res.status(400).json({ message: "Invalid blog ID type provided" })
      return;
    }

    if (!content) {
      res.status(400).json({ message: "Title missing" });
      return;
    }

    if (parent && !parseInt(parent)) {
      res.status(400).json({ message: "Invalid parent ID type provided" });
      return;
    }

    try {
      const comment = await prisma.comment.create({
        data: {
          content,
          createdAt: new Date(Date.now()),
          post: {
            connect: { id: parseInt(postId) }
          }, 
          parent: parent ? {
            connect: { id: parseInt(parent) }
          } : undefined,
          createdBy: {
            connect: {
              id: req.user?.id
            }
          }
        }, 
        include: {
          replies: true
        }
      })

      res.status(201).json(comment);
      return;

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003' || error.code === 'P2025') {
          res.status(404).json({ message: 'Post, user or parent comment not found' });
          return;
        }
        res.status(400).json({ message: `error ${error.code}: ${error.message}` });
        return;
      } 
    }
  } else if (req.method === "GET") {
    const { postId, parentId, page = 1, limit = 10, sortBy }: BlogPostQuery & GetBlogPostsQuery = req.query;
    
    if (!postId) {
      res.status(400).json({ message: "Blog ID not provided" })
      return;
    }

    if (!parseInt(postId)) {
      res.status(400).json({ message: "Invalid blog ID type provided" })
      return;
    }

    if (parentId && !parseInt(parentId)) {
      res.status(400).json({ message: "Invalid parent ID" })
    }

    if (typeof(page) === "string" && !parseInt(page) || typeof(limit) === "string" && !parseInt(limit)) {
      res.status(400).json({ message: "Invalid page and limit values" })
    }
    
    if (sortBy && !(sortBy === "mostControversial" || sortBy === "mostValued")) {
      res.status(400).json({ message: "Invalid sort value" });
      return;
    }

    const pageInt = typeof(page) === "string" ? parseInt(page) : page;
    const limitInt = typeof(limit) === "string" ? parseInt(limit) : limit;

    const comments = await prisma.comment.findMany({
      where : {
        ...(!isExtended(req) || req.user.userType !== "ADMIN" ?
        {OR: [
          { isHidden: false }, 
          isExtended(req) ? { userId: req.user.id } : undefined
        ].filter(value => !!value)} : {}), 
        postId: parseInt(postId),
        parentId: parentId ? parseInt(parentId) : null
      }, 
      include: {
        replies: true,
        _count: {
          select: {
            replies: true
          }
        }
      },
      orderBy: sortBy === "mostControversial" 
      ? { downvotes: 'desc' } 
      : sortBy === "mostValued" ? { upvotes: 'desc' } 
      : { createdAt: 'desc' }
      ,
      skip: (pageInt - 1) * limitInt,
      take: limitInt
    });

    const count = await prisma.comment.count({
      where: {
        ...(!isExtended(req) || req.user.userType !== "ADMIN" ?
        {OR: [
          { isHidden: false }, 
          isExtended(req) ? { userId: req.user.id } : undefined
        ].filter(value => !!value)} : {}), 
        postId: parseInt(postId),
        parentId: parentId === null ? parentId : parentId ? parseInt(parentId) : undefined
      }
    })

    res.status(200).json({ comments, count});
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default protectedRoute(handler, ["POST"]);