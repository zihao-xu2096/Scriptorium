import { prisma } from '@/prisma/prisma';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Validate required fields
      const { title, explanation, language, code, authorId, tags } = req.body;
      
      if (!title || !explanation || !language || !code || !authorId) {
        return res.status(400).json({ 
          error: 'Missing required fields: title, explanation, language, code, and authorId are required' 
        });
      } 

      // Verify author exists
      const authorExists = await prisma.user.findUnique({
        where: { id: authorId }
      });

      if (!authorExists) {
        return res.status(400).json({ error: 'Author not found' });
      }

      // Create template with optional tags
      const template = await prisma.codeTemplate.create({
        data: {
          title,
          explanation,
          language,
          code,
          author: {
            connect: { id: authorId }
          },
          ...(tags && {
            tags: {
              connectOrCreate: tags.map(tagName => ({
                where: { name: tagName },
                create: { name: tagName }
              }))
            }
          })
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          tags: true
        }
      });

      res.status(201).json(template);

    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: 'Error creating template' });
    }
  }

  else if (req.method === 'GET') {
    try {
      const { id, authorId, language, tag } = req.query;

      let whereClause = {};
      
      // Build where clause based on provided query parameters
      if (id) {
        whereClause.id = parseInt(id);
      }
      if (authorId) {
        whereClause.authorId = parseInt(authorId);
      }
      if (language) {
        whereClause.language = language;
      }
      if (tag) {
        whereClause.tags = {
          some: {
            name: tag
          }
        };
      }

      const templates = await prisma.codeTemplate.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          tags: true,
          savedBy: {
            select: {
              id: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (id && templates.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.status(200).json(templates);

    } catch (error) {
      console.error('Error retrieving templates:', error);
      res.status(500).json({ error: 'Error retrieving templates' });
    }
  }

  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}