import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from '@/prisma/prisma';

import { protectedRoute } from "@/middleware/auth";
import { ApiError, ExtendedRequest } from "@/new-types";
import { NextApiResponse } from "next";
import { Post } from "@prisma/client";

type RateBlogPostQuery = {
  postId?: string
}

async function handler(req: ExtendedRequest, res: NextApiResponse<Post | ApiError>) {
  if (req.method === "PUT") {
    const { postId: id }: RateBlogPostQuery = req.query;
    const { ratingType } = req.body;

    if (!id) {
      res.status(400).json({ message: "id not provided" })
      return;
    }

    if (!parseInt(id)) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
    }

    if (!ratingType || (ratingType !== "upvote" && ratingType !== "downvote")) {
      res.status(400).json({ message: "Invalid rating type provided" })
      return;
    }

    try {
      const voteList = await prisma.postVote.findMany({
        where: {
          post: {
            id: parseInt(id)
          },
          user: {
            id: req.user.id
          }
        }
      })

      if (voteList.length > 1) {
        res.status(500).json({ message: "Unique constraint violation" })
      }

      const vote = voteList[0];

      if (vote) {
        if (vote.voteType === ratingType) {
          await prisma.postVote.deleteMany({
            where: {
              post: {
                id: parseInt(id)
              },
              user: {
                id: req.user.id
              }
            }
          })

          const post = await prisma.post.update({
            where: {
              id: parseInt(id)
            },
            data: {
              [ratingType === "upvote" ? "upvotes" : "downvotes"]: {
                decrement: 1
              }
            }
          })

        res.status(200).json(post)
        return;
        } else {
          await prisma.postVote.updateMany({
            where: {
              post: {
                id: parseInt(id)
              },
              user: {
                id: req.user.id
              }
            }, 
            data: {
              voteType: ratingType
            }
          })

          const post = await prisma.post.update({
            where: {
              id: parseInt(id)
            },
            data: {
              [ratingType === "upvote" ? "upvotes" : "downvotes"]: {
                increment: 1
              }, 
              [ratingType === "upvote" ? "downvotes" : "upvotes"]: {
                decrement: 1
              }
            }
          })

        res.status(200).json(post)
        return;
        }
      } else {
        await prisma.postVote.create({
          data: {
            user: {
              connect: {
                id: req.user.id
              }
            }, 
            post: {
              connect: {
                id: parseInt(id)
              }
            }, 
            voteType: ratingType
          }
        })

        const post = await prisma.post.update({
          where: {
            id: parseInt(id)
          },
          data: {
            [ratingType === "upvote" ? "upvotes" : "downvotes"]: {
              increment: 1
            }
          }
        })

        res.status(200).json(post)
        return;
      }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2016' || error.code === 'P2025') {
          return res.status(404).json({ message: 'Post not found.' });
        }
        res.status(400).json({ message: `error ${error.code}: ${error.message}` });
        return;
      } 
    }

  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default protectedRoute(handler, ["PUT"]);