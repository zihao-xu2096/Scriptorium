import { prisma } from "@/utils/db"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { protectedRoute } from "../../../middleware/auth";

async function handler(req, res) {
  if (req.method === "POST") {
    //creating a blog post
    const { title, description, tags } = req.body;

    if (!title) {
      res.status(400).json({ message: "Title missing" });
      return;
    }

    try {
      const post = await prisma.post.create({
        data: {
          title,
          description,
          content: '',
          tags: {
            connectOrCreate: tags?.map(tag => ({
              where: { label: tag },
              create: { label: tag }
            })) || [],
          },
          createdBy: {
            connect: {
              id: req.user.id
            }
          }
        },
      })

      res.status(201).json(post);
      return;

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003' || error.code === 'P2025') {
          res.status(400).json({ message: 'User not found' });
          return;
        }
        res.status(400).json({message: `threw a ${error.code} instead. ${error.message}`})
      } 
      else {
        res.status(500).json({message: error.message});
      }
    }
  } else if (req.method === "GET") {
    const { title, content, tags, templates, page = 1, limit = 10, sortBy } = req.query;

    if (title && typeof(title) !== "string") {
      res.status(400).json({ message: "Title must be a string" });
      return;
    }

    if (!parseInt(page) || !parseInt(limit)) {
      res.status(400).json({ message: "Invalid page and limit values" });
      return;
    }

    if (sortBy && !(sortBy === "mostControversial" || sortBy === "mostValued")) {
      res.status(400).json({ message: "Invalid sort values" });
      return;
    }

    const tagNames = tags?.split(",").map(tag => tag.trim()) || [];

    const posts = await prisma.post.findMany({
      where : {
          OR: [
            { isHidden: false }, 
            req.user ? { userId: req.user.id } : undefined
          ].filter(value => !!value), 
          title: title ? {
            contains: title
          } : undefined, 
          content: content ? {
            contains: content
          } : undefined,
          tags: tags ? {
            some: {
              label: {
                in: tagNames
              }
            }
          } : undefined,
          /**templates: {
            some: {

            }
          }**/
      }, 
      include: {
        tags: {
          select: {
            label: true
          }
        }
      },
      orderBy: sortBy === "mostControversial" 
      ? { downvotes: 'desc' } 
      : sortBy === "mostValued" ? { upvotes: 'desc' } 
      : { createdAt: 'desc' }
      ,
      skip: parseInt(page - 1) * limit,
      take: parseInt(limit)
    });

    res.status(200).json(posts);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default protectedRoute(handler, ['POST']);