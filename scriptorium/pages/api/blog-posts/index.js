import { prisma } from "@/utils/db";

async function handler(req, res) {
  if (req.method === "GET") {
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
        AND: {
          isHidden: false,
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

export default handler; 