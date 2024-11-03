import { prisma } from "@/utils/db";
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
        const blog = await prisma.post.create({
        data: {
            title,
            description,
            createdAt: new Date(Date.now()),
            content: '',
            tags: {
            connectOrCreate: tags?.map(tag => ({
                where: { label: tag },
                create: { label: tag }
            })) || [],
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
    }
    else {
        res.status(405).json({ message: "Method not allowed" });
    }
}

export default protectedRoute(handler);