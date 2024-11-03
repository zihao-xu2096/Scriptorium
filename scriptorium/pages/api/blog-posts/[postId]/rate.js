import { prisma } from "@/utils/db";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { protectedRoute } from "../../../../middleware/auth";

async function handler(req, res) {
  if (req.method === "PUT") {
    const { postId: id, ratingType } = req.query;

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
          id: parseInt(id)
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
          return res.status(404).json({ error: 'Post not found.' });
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

export default protectedRoute(handler);