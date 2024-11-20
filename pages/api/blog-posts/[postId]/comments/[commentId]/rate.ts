import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from '@/prisma/prisma';
import { protectedRoute } from "@/middleware/auth";
import { ApiError, ExtendedRequest } from "@/new-types";
import { NextApiResponse } from "next";
import { Comment } from "@prisma/client";

type CommentQuery = {
  postId?: string
  commentId?: string
}

type RatePostBody = {
  ratingType: string
}

async function handler(req: ExtendedRequest, res: NextApiResponse<Comment | ApiError>) {
  if (req.method === "PUT") {
    const { commentId: id, postId }: CommentQuery = req.query;
    const { ratingType }: RatePostBody  = req.body;

    if (!id || !postId) {
      res.status(400).json({ message: "ID not provided" })
      return;
    }

    if (!parseInt(id) || !parseInt(postId)) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
    }

    if (!ratingType || (ratingType !== "upvote" && ratingType !== "downvote")) {
      res.status(400).json({ message: "Invalid rating type provided" })
      return;
    }

    try {
      let comment = await prisma.comment.update({
        where: {
          id: parseInt(id),
          post: {
            id: parseInt(postId)
          },
          createdBy: {
            id: req.user?.id
          }
        }, 
        data: ratingType === "upvote" 
        ? { upvotes: { increment: 1 } }
        : { downvotes: { increment: 1 } },
        include: { replies: true }
      })
      
      res.status(200).json(comment);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2016' || error.code === 'P2025') {
          return res.status(404).json({ message: 'Comment not found.' });
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