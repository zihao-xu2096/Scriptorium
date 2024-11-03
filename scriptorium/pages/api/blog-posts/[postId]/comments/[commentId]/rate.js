import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "@/utils/db";

export default async function handler(req, res) {
  if (req.method === "PUT") {
    const { commentId: id, ratingType } = req.query;

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
      let comment = await prisma.comment.update({
        where: {
          id: parseInt(id)
        }, 
        data: ratingType === "upvote" 
        ? { upvotes: { increment: 1 } }
        : { downvotes: { increment: 1 } },
        include: { tags: true }
      })
      
      res.status(200).json(comment);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2016' || error.code === 'P2025') {
          return res.status(404).json({ error: 'Comment not found.' });
        }
        res.status(400).json({ message: `error ${error.code}: ${error.message}` });
        return;
      } else {
        res.status(500).json({ message: error.message });
        return;
      }
    }

  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}