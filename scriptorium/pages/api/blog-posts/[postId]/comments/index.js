import { prisma } from "@/utils/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { postId, page = 1, limit = 10, sortBy } = req.query;
    
    if (!postId) {
      res.status(400).json({ message: "Blog ID not provided" })
      return;
    }

    if (!parseInt(postId)) {
      res.status(400).json({ message: "Invalid blog ID type provided" })
      return;
    }

    if (!parseInt(page) || !parseInt(limit)) {
      res.status(400).json({ message: "Invalid page and limit values" })
    }
    
    if (sortBy && !(sortBy === "mostControversial" || sortBy === "mostValued")) {
      res.status(400).json({ message: "Invalid sort values" });
      return;
    }

    const comments = await prisma.comment.findMany({
      where : {
        isHidden: false,
        postId: parseInt(postId), 
        replies: {
          some: {}
        }
      }, 
      include: {
        replies: true
      },
      orderBy: sortBy === "mostControversial" 
      ? { downvotes: 'desc' } 
      : sortBy === "mostValued" ? { upvotes: 'desc' } 
      : { createdAt: 'desc' }
      ,
      skip: parseInt(page - 1) * limit,
      take: parseInt(limit)
    });

    res.status(200).json(comments);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}