import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from '@/prisma/prisma';

import { protectedRoute } from "@/middleware/auth";
import { ApiError, ExtendedRequest } from "@/new-types";
import { NextApiResponse } from "next";
import { Post } from "@prisma/client";

type RateBlogPostQuery = {
  postId?: string
}

async function handler(req: ExtendedRequest, res: NextApiResponse<Post | ApiError>) {
  if (req.method === "PUT") {
    const { postId: id }: RateBlogPostQuery = req.query;
    const { ratingType } = req.body;

    if (!id) {
      res.status(400).json({ message: "id not provided" })
      return;
    }

    if (!parseInt(id)) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
    }

    if (!ratingType || (ratingType !== "upvote" && ratingType !== "downvote")) {
      res.status(400).json({ message: "Invalid rating type provided" })
      return;
    }

    try {
      let post = await prisma.post.update({
        where: {
          id: parseInt(id),
          createdBy: {
            id: req.user?.id
          }
        }, 
        data: ratingType === "upvote" 
        ? { upvotes: { increment: 1 } }
        : { downvotes: { increment: 1 } },
        include: { tags: true }
      })
      
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

  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default protectedRoute(handler, ["PUT"]);