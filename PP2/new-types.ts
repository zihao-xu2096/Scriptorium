import { NextApiRequest } from "next";
import { User } from "@prisma/client"; 

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
  user: User
}

export function isExtended(req: NextApiRequest | ExtendedRequest): req is ExtendedRequest {
  return 'user' in req && req.user !== undefined;
}