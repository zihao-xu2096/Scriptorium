import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "@/pages/prisma";

export default async function handler(req, res) {
  if (req.method === "PUT") {
    const { title, isbn, publishedDate, available } = req.body;
    const { id } = req.query;

    if (!id) {
      res.status(400).json({ message: "id not provided" })
      return;
    }

    if (isNaN(Number(id))) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
    }

    if (title && typeof(title) !== "string") {
      res.status(400).json({ message: "Invalid type for title" })
      return;
    }

    if (isbn && typeof(isbn) !== "string") {
      res.status(400).json({ message: "Invalid type for ISBN" })
      return;
    }

    if (publishedDate && isNaN(new Date(publishedDate).getTime())) {
      res.status(400).json({ message: "Invalid date format" })
      return;
    }

    if (available !== undefined && typeof(available) !== "boolean") {
      res.status(400).json({ message: "Invalid type for available" })
      return;
    }

    const data = {};
    if (title) data.title = title;
    if (isbn) data.isbn = isbn;
    if (publishedDate) data.publishedDate = new Date(publishedDate);
    if (available !== undefined) data.available = available;

    try {
      const book = await prisma.book.update({
        where: {
          id: Number(id)
        }, 
        data,
      })

      res.status(200).json(book);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Book not found.' });
        }
        res.status(400).json({ message: `error ${error.code}: ${error.message}` });
        return;
      } else {
        res.status(500).json({ message: "Unknown Prisma error" });
        return;
      }
    }

  } else if (req.method === "DELETE") {
    const { id } = req.query;

    if (!id) {
      res.status(400).json({ message: "id not provided" })
      return;
    }

    if (isNaN(Number(id))) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
    }

    try {
      const deleteBook = await prisma.book.delete({
        where: {
          id: Number(id)
        }
      });

      res.status(200).json({ message: `Successfully deleted ${deleteBook.title}.` });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Book not found.' });
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