import { FastifyReply, FastifyRequest } from "fastify";
import * as yup from "yup";


export type FastifyHandler<T = void> = (
  req: FastifyRequest<T>,
  res: FastifyReply
) => Promise<void>

export interface UserAccountPostBody {
  email: string;
  password: string;
}

export interface UserAccountFormHandler {
  Body: UserAccountPostBody
}

export const userAccountSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
});
