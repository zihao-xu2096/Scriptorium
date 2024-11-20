import { NextApiRequest } from "next";


export type ApiError = {
  message: string
}

export type User = {
  id: number;
  createdAt: Date;
  email: string;
  phoneNum?: string | null;
  userType: string;
  password: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  updatedAt: Date;
}

export type BlogPost = {
  title: string;
  description: string | null;
  content: string;
  id: number;
  createdAt: Date;
  userId: number;
  isHidden: boolean;
  upvotes: number;
  downvotes: number;
  linkedTemplates?: {
    id: number;
  }[];
  tags?: {
    id?: number;
    label: string;
  }[];
}


export type Report = {
  id: number
  postId?: number | null
  userId: number
  explanation: string
  commentId?: number | null
}

export type UserPayload = {
  id: number
  userType: "USER" | "ADMIN"
  email: string
}

export interface ExtendedRequest extends NextApiRequest {
  user?: User
}