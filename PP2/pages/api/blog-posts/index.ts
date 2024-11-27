import { prisma } from '@/prisma/prisma';

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { protectedRoute } from "@/middleware/auth";
import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError, ExtendedRequest, isExtended } from '@/new-types';
import { Post } from '@prisma/client';

type CreateBlogPostsBody = {
  title: string
  description?: string
  tags?: string[]
}

type BlogPostsQuery = {
  title?: string
  tags?: string
  content?: string
  templates?: string
  page?: string | number
  limit?: string | number
  sortBy?: string
  author?: string
}

async function handler(req: ExtendedRequest | NextApiRequest, res: NextApiResponse<Post | ApiError | Post[]>) {
  if (req.method === "POST") {
    if (!isExtended(req)) {
      res.status(401).json({ message: "No user found" });
      return;
    } 

    const { title, description, tags }: CreateBlogPostsBody = req.body;

    if (!title) {
      res.status(400).json({ message: "Title missing" });
      return;
    }

    try {
      const post = await prisma.post.create({
        data: {
          title,
          description,
          content: '',
          tags: {
            connectOrCreate: tags?.map((tag) => ({
              where: { label: tag },
              create: { label: tag }
            })) || [],
          },
          createdBy: {
            connect: {
              id: req.user.id
            }
          }
        },
        include: {
          tags: {
            select: { label: true }
          }
        }
      })

      res.status(201).json(post);
      return;

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003' || error.code === 'P2025') {
          res.status(400).json({ message: 'User not found' });
          return;
        }
        res.status(400).json({ message: `error ${error.code}: ${error.message}` });
        return;
      }
    }
  } else if (req.method === "GET") {
    const { author, title, content, tags, templates, page = 1, limit = 10, sortBy }: BlogPostsQuery = req.query;

    if (typeof(page) === "string" && !parseInt(page) || typeof(limit) === "string" && !parseInt(limit)) {
      res.status(400).json({ message: "Invalid page and limit values" });
      return;
    }

    if (sortBy && !(sortBy === "mostControversial" || sortBy === "mostValued")) {
      res.status(400).json({ message: "Invalid sort value" });
      return;
    }

    if (author && !parseInt(author)) {
      res.status(400).json({message: "Invalid author id"})
    }

    const tagNames = tags?.split(',').map(tag => tag.trim()) || [];
    const templateIdStrings = templates?.split(",") || [];
    const pageInt = typeof(page) === "string" ? parseInt(page) : page;
    const limitInt = typeof(limit) === "string" ? parseInt(limit) : limit;

    templateIdStrings.map(id => {
      if (!parseInt(id)) {
        res.status(400).json({ message: "Invalid template ID value" });
      }
    })

    const templateIds = templateIdStrings.map(id => parseInt(id))

    const posts = await prisma.post.findMany({
      where : {
          ...(!isExtended(req) || req.user.userType !== "ADMIN" ?
          {OR: [
            { isHidden: false }, 
            isExtended(req) ? { userId: req.user.id } : undefined
          ].filter(value => !!value)} : {}), 
          title: title ? {
            contains: title
          } : undefined, 
          content: content ? {
            contains: content
          } : undefined,
          userId: author ? {
              equals: parseInt(author)
          } : undefined,
          tags: tags ? {
            some: {
              label: {
                in: tagNames
              }
            }
          } : undefined,
          linkedTemplates: templates ? {
            some: {
              id: {
                in: templateIds
              }
            }
          } : undefined
      }, 
      include: {
        tags: {
          select: {
            label: true
          }
        },
        _count: true
      },
      orderBy: sortBy === "mostControversial" 
      ? { downvotes: 'desc' } 
      : sortBy === "mostValued" ? { upvotes: 'desc' } 
      : { createdAt: 'desc' }
      ,
      skip: (pageInt - 1) * limitInt,
      take: limitInt
    });

    res.status(200).json(posts);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default protectedRoute(handler, ['POST']);