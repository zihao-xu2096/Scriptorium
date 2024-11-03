import { prisma } from "@/utils/db";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { protectedRoute } from "../../../../middleware/auth";

async function handler(req, res) {
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
  }
  else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
export default protectedRoute(handler);