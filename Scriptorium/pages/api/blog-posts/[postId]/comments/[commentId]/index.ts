import { protectedRoute } from '@/middleware/auth';
import { ApiError, ExtendedRequest, isExtended } from '@/new-types';
import { prisma } from '@/prisma/prisma';
import { Comment } from '@prisma/client';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextApiRequest, NextApiResponse } from 'next';

type CommentQuery = {
  postId?: string
  commentId?: string
}

async function handler(req: ExtendedRequest | NextApiRequest, res: NextApiResponse<Comment | ApiError>) {
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
          ...(!isExtended(req) || req.user.userType !== "ADMIN" ?
          {OR: [
            { isHidden: false }, 
            isExtended(req) ? { userId: req.user.id } : undefined
          ].filter(value => !!value)} : {}), 
        }, 
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          },
          replies: true
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

    if (!isExtended(req)) {
      res.status(401).json({ message: "No user found" });
      return;
    } 

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
          id: parseInt(id),
          createdBy: {
            id: req.user.id
          }
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

export default protectedRoute(handler, ["DELETE"])