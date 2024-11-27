import { NextApiRequest } from "next";
import { Post } from '@prisma/client';

export type ApiError = {
  message: string
}

export type UserPayload = {
  id: number
  userType: "USER" | "ADMIN"
  email: string
  firstName: string
  lastName: string
  phoneNum?: string
  avatarUrl?: string
}

export interface ExtendedRequest extends NextApiRequest {
  user: UserPayload
}


export function isExtended(req: NextApiRequest | ExtendedRequest): req is ExtendedRequest {
  return Object.hasOwn(req, "user");
}