import { prisma } from "@/utils/db"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export default async function handler(req, res) {
  if (req.method === "POST") {
    //creating a blog post
    const { content, parent } = req.body;
    const { postId } = req.query;

    if (!postId) {
      res.status(400).json({ message: "Blog ID not provided" })
      return;
    }

    if (!parseInt(postId)) {
      res.status(400).json({ message: "Invalid blog ID type provided" })
      return;
    }

    if (!content) {
      res.status(400).json({ message: "Title missing" });
      return;
    }

    if (parent && !parseInt(parent)) {
      res.status(400).json({ message: "Invalid parent ID type provided" })
      return;
    }

    try {
      const comment = await prisma.comment.create({
        data: {
          content,
          createdAt: new Date(Date.now()),
          upvotes: 0,
          downvotes: 0,
          post: {
            connect: { id: parseInt(postId) }
          }, 
          parent: parent ? {
            connect: { id: parseInt(parent) }
          } : undefined,
          user: {
            connectOrCreate: {
              where: { id: 1 },
              create: {
                userType: "ADMIN",
                email: "a@b.c",
                password: "abc",
                createdAt: new Date(Date.now()),
                firstName: "Jane",
                lastName: "Doe",
                avatarUrl: "sdghja",
                phoneNum: "67318290"
              }
            }
          }
        }, 
        include: {
          parent: true,
          replies: true,
          reports: true
        }
      })

      res.status(201).json(comment);
      return;

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003' || error.code === 'P2025') {
          res.status(400).json({ message: 'Post or parent comment not found' });
          return;
        }
        res.status(400).json({message: `threw a ${error.code} instead. ${error.message}`})
      } 
      else {
        res.status(500).json({message: error.message});
      }
    }
  } else if (req.method === "GET") {
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