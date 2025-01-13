import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from '@/prisma/prisma';
import { protectedRoute } from "@/middleware/auth";
import { ExtendedRequest } from "@/new-types";
import { NextApiResponse } from "next";

type CommentQuery = {
  postId?: string
  commentId?: string
}

async function handler(req: ExtendedRequest, res: NextApiResponse) {
  if (req.method === "PUT") {
    const { commentId: id, postId }: CommentQuery = req.query;

    if (!id || !postId) {
      res.status(400).json({ message: "id not provided" })
      return;
    }

    if (!parseInt(id) || !parseInt(postId)) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
    }

    if (req.user?.userType !== "ADMIN") {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    try {
      let comment = await prisma.comment.update({
        where: {
          id: parseInt(id),
          post: {
            id: parseInt(postId)
          }
        }, 
        data: {
          isHidden: true
        }
      })
      
      res.status(200).json(comment);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2016' || error.code === 'P2025') {
          return res.status(404).json({ error: 'Comment not found.' });
        }
        res.status(400).json({ message: `error ${error.code}: ${error.message}` });
        return;
      }
    }

  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default protectedRoute(handler, ["PUT"]);