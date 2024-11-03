import { prisma } from "@/utils/db"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export default async function handler(req, res) {
  if (req.method === "GET") { 
    const { commentId: id } = req.query;

    if (!id) {
      res.status(400).json({ message: "ID not provided" })
      return;
    }

    if (!parseInt(id)) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
    }

    try {
      const comment = await prisma.comment.findUnique({
        where: {
          id: parseInt(id),
          OR: [
            { isHidden: false }, 
            req.user ? { userId: req.user.id } : undefined
          ].filter(value => !!value)
        }
      });

      if (!comment) {
        res.status(404).json({ error: 'Comment not found.' });
        return;
      }

      res.status(200).json({comment});
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Comment not found.' });
        }
        res.status(400).json({ message: `error ${error.code}: ${error.message}` });
        return;
      } else {
        res.status(500).json({ message: "Unknown Prisma error" });
        return;
      }
    }
  } else if (req.method === "DELETE") {
    const { commentId: id } = req.query;

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
          return res.status(404).json({ error: 'Comment not found.' });
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