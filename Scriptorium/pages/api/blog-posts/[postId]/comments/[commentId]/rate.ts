import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from '@/prisma/prisma';
import { protectedRoute } from "@/middleware/auth";
import { ApiError, ExtendedRequest } from "@/new-types";
import { NextApiResponse } from "next";
import { Comment } from "@prisma/client";

type CommentQuery = {
  postId?: string
  commentId?: string
}

type RatePostBody = {
  ratingType: string
}

async function handler(req: ExtendedRequest, res: NextApiResponse<Comment | ApiError>) {
  if (req.method === "PUT") {
    const { commentId: id, postId }: CommentQuery = req.query;
    const { ratingType }: RatePostBody  = req.body;

    if (!id || !postId) {
      res.status(400).json({ message: "ID not provided" })
      return;
    }

    if (!parseInt(id) || !parseInt(postId)) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
    }

    if (!ratingType || (ratingType !== "upvote" && ratingType !== "downvote")) {
      res.status(400).json({ message: "Invalid rating type provided" })
      return;
    }

    try {
      const voteList = await prisma.commentVote.findMany({
        where: {
          comment: {
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
          const comment = await prisma.comment.update({
            where: {
              id: parseInt(id),
              post: {
                id: parseInt(postId)
              }
            },
            data: {
              [ratingType === "upvote" ? "upvotes" : "downvotes"]: {
                decrement: 1
              }
            }
          })

          await prisma.commentVote.deleteMany({
            where: {
              comment: {
                id: parseInt(id)
              },
              user: {
                id: req.user.id
              }
            }
          })
  
        res.status(200).json(comment)
        return;
        } else {
          const comment = await prisma.comment.update({
            where: {
              id: parseInt(id),
              post: {
                id: parseInt(postId)
              }
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

          await prisma.commentVote.updateMany({
            where: {
              comment: {
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
  
  
          res.status(200).json(comment)
          return;
        }
      } else {
        const comment = await prisma.comment.update({
          where: {
            id: parseInt(id),
            post: {
              id: parseInt(postId)
            }
          },
          data: {
            [ratingType === "upvote" ? "upvotes" : "downvotes"]: {
              increment: 1
            }
          }
        })


        await prisma.commentVote.create({
          data: {
            user: {
              connect: {
                id: req.user.id
              }
            }, 
            comment: {
              connect: {
                id: parseInt(id)
              }
              }, 
            voteType: ratingType
          }
        })
  
          res.status(200).json(comment)
          return;
      } 
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2016' || error.code === 'P2025') {
          return res.status(404).json({ message: 'Comment not found.' });
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