import { ApiError, ExtendedRequest } from '@/new-types';
import { prisma } from '@/prisma/prisma';
import { Comment } from '@prisma/client';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextApiResponse } from 'next';

type CommentQuery = {
  postId?: string
  commentId?: string
}

export default async function handler(req: ExtendedRequest, res: NextApiResponse<Comment | ApiError>) {
  if (req.method === "GET") { 
    const { commentId: id, postId }: CommentQuery = req.query;

    if (!id || !postId) {
      res.status(400).json({ message: "ID not provided" })
      return;
    }

    if (!parseInt(id) || !parseInt(postId)) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
    }

    try {
      const comment = await prisma.comment.findUnique({
        where: {
          id: parseInt(id),
          post: {
            id: parseInt(postId)
          },
          OR: [
            { isHidden: false }, 
            req.user ? { userId: req.user.id } : undefined
          ].filter(value => !!value)
        }
      });

      if (!comment) {
        res.status(404).json({ message: 'Comment not found.' });
        return;
      }

      res.status(200).json(comment);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ message: 'Comment not found.' });
        }
        res.status(400).json({ message: `error ${error.code}: ${error.message}` });
        return;
      } else {
        res.status(500).json({ message: "Unknown Prisma error" });
        return;
      }
    }
  } else if (req.method === "DELETE") {
    const { commentId: id }: CommentQuery = req.query;

    if (!id) {
      res.status(400).json({ message: "id not provided" });
      return;
    }

    if (!parseInt(id)) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
    }

    try {
      await prisma.comment.delete({
        where: {
          id: parseInt(id)
        }
      });

      res.status(200).json({ message: `Successfully deleted commment.` });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ message: 'Comment not found.' });
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