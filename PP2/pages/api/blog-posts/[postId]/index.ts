import { prisma } from '@/prisma/prisma';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { protectedRoute } from "@/middleware/auth";
import { ApiError, ExtendedRequest, isExtended } from "@/new-types";
import { Post } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

type GetBlogPostQuery = {
  postId?: string
}

type UpdateBlogPostBody = {
  title?: string
  description?: string
  content?: string
  tags?: string[]
  templates?: number[]
}


async function handler(req: ExtendedRequest | NextApiRequest, res: NextApiResponse<Post | ApiError>) {
  if (req.method === "GET") { 
    const { postId: id }: GetBlogPostQuery = req.query;

    if (!id) {
      res.status(400).json({ message: "ID not provided" })
      return;
    }

    if (!parseInt(id)) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
    }

    try {
      const post = await prisma.post.findUnique({
        where: {
          id: parseInt(id),
          ...(!isExtended(req) || req.user.userType !== "ADMIN" ?
          {OR: [
            { isHidden: false }, 
            isExtended(req) ? { userId: req.user.id } : undefined
          ].filter(value => !!value)} : {}), 
        }
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found.' });
      } else {
        res.status(200).json(post);
      }

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ message: 'Post not found.' });
        }
        res.status(400).json({ message: `error ${error.code}: ${error.message}` });
        return;
      } else {
        console.log("This is error", error);
        res.status(500).json({ message: "Unknown Prisma error" });
        return;
      }
    }
  } else if (req.method === "PUT") {
    const { title, description, content, tags, templates }: UpdateBlogPostBody = req.body;
    const { postId: id }: GetBlogPostQuery = req.query;

    if (!isExtended(req)) {
      res.status(401).json({ message: "No user found" });
      return;
    } 

    if (!id) {
      res.status(400).json({ message: "ID not provided" })
      return;
    }

    if (!parseInt(id)) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
    }

    let filteredTemplates = templates;

    if (templates) {
      let allTemplates = await prisma.codeTemplate.findMany();
      
      filteredTemplates = templates.filter((id) => {
        allTemplates.map(template => template.id).includes(id)
      })
    }

    try {
      let post = await prisma.post.update({
        where: {
          id: parseInt(id),
          userId: req.user.id
        }, 
        data: {
          title,
          description,
          content,
          tags: {
            connectOrCreate: tags?.map((tag: string) => ({
              where: { label: tag },
              create: { label: tag }
            })) || []
          }, 
          linkedTemplates: {
            connect: filteredTemplates?.map((id: number) => ({
               id 
            })) || []
          }
        },
        include: { 
          tags: {
            select: {
              label: true
            }
          },
          linkedTemplates: {
            select: {
              id: true
            }
          }
        }
      })

      const tagsToDisconnect = post.tags
        .map(tag => tag.label)
        .filter(tag => tags && !tags.includes(tag));

      const templatesToDisconnect = post.linkedTemplates
        .map(template => template.id)
        .filter(template => templates && !templates.includes(template));

      if (tagsToDisconnect.length > 0 || templatesToDisconnect.length > 0) {
        post = await prisma.post.update({
          where: { 
            id: parseInt(id),
            userId: req.user.id
          },
          data: {
            tags: {
              disconnect: tagsToDisconnect.map(tag => ({
                label: tag
              }))
            },

            linkedTemplates: {
              disconnect: templatesToDisconnect.map(id => ({
                id
              }))
            }
          },
          include: { 
            tags: {
              select: {
                label: true
              }
            },
            linkedTemplates: {
              select: {
                id: true
              }
            }
          }
        })
      }

      res.status(200).json(post);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2016' || error.code === 'P2025') {
          return res.status(404).json({ message: 'Post not found.' });
        }
        res.status(400).json({ message: `error ${error.code}: ${error.message}` });
        return;
      } 
    }

  } else if (req.method === "DELETE") {
    const { postId: id }: GetBlogPostQuery = req.query;

    if (!isExtended(req)) {
      res.status(401).json({ message: "No user found" });
      return;
    } 

    if (!id) {
      res.status(400).json({ message: "ID not provided" })
      return;
    }

    if (!parseInt(id)) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
    }

    try {
      const deletePost = await prisma.post.delete({
        where: {
          id: parseInt(id),
          userId: req.user?.id
        }
      });

      res.status(200).json({ message: `Successfully deleted ${deletePost.title}.` });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ message: 'Post not found.' });
        }
        res.status(400).json({ message: `error ${error.code}: ${error.message}` });
        return;
      } else {
        res.status(500).json({ message: "Unknown Prisma error" });
        return;
      }
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default protectedRoute(handler, ["PUT", "DELETE"]);