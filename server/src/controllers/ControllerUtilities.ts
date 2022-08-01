import { FastifyReply, FastifyRequest } from "fastify";
import { SessionUser } from "../web-server";
import { z } from "zod";
import { capitalizeFirstLetter } from "../utilities/functions";


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


// https://github.com/colinhacks/zod/discussions/931#discussioncomment-2169429
export const numericStringConstraint = (name: string) =>
  z.preprocess(input => {
    if ( typeof input === "number" ) {
      return input;
    }

    if (z.string().regex(/^\d+$/).safeParse(input).success) {
      return Number(input);
    }

    return input;
  },
  z.number({
    required_error: `${capitalizeFirstLetter(name)} is required`,
    invalid_type_error: `${capitalizeFirstLetter(name)} must be a number`,
  }).positive({
    message: `${capitalizeFirstLetter(name)} must be greater than 0`,
  }));


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isSessionAvailable = (x: any): x is SessionUser =>
  Object.hasOwn(x, "id");
