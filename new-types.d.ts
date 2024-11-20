import { NextApiRequest } from "next";


export type ApiError = {
  message: string
}

export type UserPayload = {
  id: number
  userType: "USER" | "ADMIN"
  email: string
}

export interface ExtendedRequest extends NextApiRequest {
  user: User
}

export function isExtended(req: NextApiRequest | ExtendedRequest): req is ExtendedRequest {
  return req.user;
}