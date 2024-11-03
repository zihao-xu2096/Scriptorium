import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from '@/prisma/prisma';

import { protectedRoute } from "../../../../middleware/auth";

async function handler(req, res) {
  if (req.method === "GET") { 
    const { postId: id } = req.query;

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
          OR: [
            { isHidden: false }, 
            req.user ? { userId: req.user.id } : undefined
          ].filter(value => !!value)
        }
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found.' });
      }

      res.status(200).json({post});
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Post not found.' });
        }
        res.status(400).json({ message: `error ${error.code}: ${error.message}` });
        return;
      } else {
        res.status(500).json({ message: "Unknown Prisma error" });
        return;
      }
    }
  } else if (req.method === "PUT") {
    const { title, description, content, tags } = req.body;
    const { postId: id } = req.query;

    if (!id) {
      res.status(400).json({ message: "ID not provided" })
      return;
    }

    if (!parseInt(id)) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
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
            connectOrCreate: tags?.map((tag) => ({
              where: { label: tag },
              create: { label: tag }
            })) || []
          }
        }, 
        include: { tags: true }
      })

      const tagsToDisconnect = post.tags
        .map(tag => tag.label)
        .filter(tag => !tags.includes(tag));

      if (tagsToDisconnect.length > 0) {
        post = await prisma.post.update({
          where: { id: parseInt(id) },
          data: {
            tags: {
              disconnect: tagsToDisconnect?.map(tag => ({
                label: tag
              }))
            }
          },
          include: { tags: true }
        })
      }

      res.status(200).json(post);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2016' || error.code === 'P2025') {
          return res.status(404).json({ error: 'Post not found.' });
        }
        res.status(400).json({ message: `error ${error.code}: ${error.message}` });
        return;
      } else {
        res.status(500).json({ message: error.message });
        return;
      }
    }

  } else if (req.method === "DELETE") {
    const { postId: id } = req.query;

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
          userId: req.user.id
        }
      });

      res.status(200).json({ message: `Successfully deleted ${deletePost.title}.` });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Post not found.' });
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