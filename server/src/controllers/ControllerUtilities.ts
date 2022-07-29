import { FastifyReply, FastifyRequest } from "fastify";
import { SessionUser } from "../web-server";
import { z } from "zod";


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

export const userAccountSchema = z.object({
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string",
  }).email(),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string",
  }).min(6, {
    message: "Password must be at least 6 characters",
  }),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isSessionAvailable = (x: any): x is SessionUser =>
  Object.hasOwn(x, "id");
