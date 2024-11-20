import { prisma } from '@/prisma/prisma';

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { protectedRoute } from "@/middleware/auth";
import { NextApiResponse } from 'next';
import { ApiError, ExtendedRequest } from '@/new-types';
import { Post } from '@prisma/client';

type CreateBlogPostsBody = {
  title: string
  description?: string
  tags?: string[]
}

type BlogPostsQuery = {
  title?: string
  tags?: string[]
  content?: string
  templates?: string[]
  page?: string | number
  limit?: string | number
  sortBy?: string
}

async function handler(req: ExtendedRequest, res: NextApiResponse<Post | ApiError | Post[]>) {
  if (req.method === "POST") {
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
              id: req.user?.id
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
    const { title, content, tags, templates, page = 1, limit = 10, sortBy }: BlogPostsQuery = req.query;

    if (typeof(page) === "string" && !parseInt(page) || typeof(limit) === "string" && !parseInt(limit)) {
      res.status(400).json({ message: "Invalid page and limit values" });
      return;
    }

    if (sortBy && !(sortBy === "mostControversial" || sortBy === "mostValued")) {
      res.status(400).json({ message: "Invalid sort value" });
      return;
    }

    const tagNames = tags?.map(tag => tag.trim()) || [];
    const templateIds = templates || [];
    const pageInt = typeof(page) === "string" ? parseInt(page) : page;
    const limitInt = typeof(limit) === "string" ? parseInt(limit) : limit;

    templateIds.map(id => {
      if (!parseInt(id)) {
        res.status(400).json({ message: "Invalid template ID values" });
      }
    })

    const posts = await prisma.post.findMany({
      where : {
          OR: [
            { isHidden: false }, 
            req.user ? { userId: req.user.id } : undefined
          ].filter(value => !!value), 
          title: title ? {
            contains: title
          } : undefined, 
          content: content ? {
            contains: content
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
              title: {
                in: templates
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
      },
      orderBy: sortBy === "mostControversial" 
      ? { downvotes: 'desc' } 
      : sortBy === "mostValued" ? { upvotes: 'desc' } 
      : { createdAt: 'desc' }
      ,
      skip: pageInt * limitInt,
      take: limitInt
    });

    res.status(200).json(posts);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default protectedRoute(handler, ['POST']);