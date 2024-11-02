import { prisma } from "@/utils/db"
import { PrismaClientKnownRequestError, skip } from "@prisma/client/runtime/library";

export default async function handler(req, res) {
  if (req.method === "POST") {
    //creating a blog post
    const { title, description, tags } = req.body;

    if (!title) {
      res.status(400).json({ message: "Title missing" });
      return;
    }

    let tagNames = [];

    if (tags) {
      tagNames = tags.split(',');
    }

    try {
      const blog = await prisma.post.create({
        data: {
          title,
          description,
          createdAt: new Date(Date.now()),
          content: '',
          tags: {
            connectOrCreate: tagNames.map(tag => ({
              where: { label: tag },
              create: { label: tag }
            })),
          },
          isHidden: false,
          upvotes: 0,
          downvotes: 0,
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
      })

      res.status(201).json(blog);
      return;

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003' || error.code === 'P2025') {
          res.status(400).json({ message: 'Author not found' });
          return;
        }
        res.status(400).json({message: `threw a ${error.code} instead. ${error.message}`})
      } 
      else {
        res.status(500).json({message: error.message});
      }
    }
  } else if (req.method === "GET") {
    const { title, content, tags, templates, page = 1, limit = 10 } = req.query;

    if (title && typeof(title) !== "string") {
      res.status(400).json({ message: "Title must be a string" });
      return;
    }

    if (!parseInt(page) || !parseInt(limit)) {
      res.status(400).json({ message: "Invalid page and limit values" })
    }

    const tagNames = tags?.split(",").map(tag => tag.trim()) || [];

    const posts = await prisma.post.findMany({
      where : {
        AND: {
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
        }
      }, 
      include: {
        tags: true
      },
      skip: parseInt(page - 1) * limit,
      take: parseInt(limit)
    });

    res.status(200).json(posts);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}