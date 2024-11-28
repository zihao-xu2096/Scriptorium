import { NextApiRequest } from "next";

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

export interface User {
  id: number;
  userType: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;  
  phoneNum?: string;   
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtendedRequest extends NextApiRequest {
  user: User;
}

export function isExtended(req: NextApiRequest | ExtendedRequest): req is ExtendedRequest {
  return 'user' in req && req.user !== undefined;
}