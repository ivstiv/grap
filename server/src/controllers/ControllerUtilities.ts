import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { capitalizeFirstLetter } from "../utilities/functions";
import type { RouteGenericInterface } from "fastify/types/route";



type OptionalRouteInterface = RouteGenericInterface | void;

export type FastifyHandler<T extends OptionalRouteInterface = void> =
  T extends RouteGenericInterface ?
    (req: FastifyRequest<T>, res: FastifyReply) => Promise<void>
    :
    (req: FastifyRequest, res: FastifyReply) => Promise<void>;


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


export const successResponse = <T>(data: z.ZodType<T>) =>
  z.object({ data }).describe("Successful response");


const getErrorSchema =
  <T extends string, U extends number>(status: U, error: T) =>
    z.object({
      statusCode: z.literal<U>(status),
      error: z.literal<T>(error),
      message: z.string().min(1),
    }).describe(error);


export const Responses = {
  BAD_REQUEST: {
    400: getErrorSchema(400, "Bad Request"),
  },
  NOT_FOUND: {
    404: getErrorSchema(404, "Not Found"),
  },
  UNAUTHORISED: {
    403: getErrorSchema(403, "Unauthorised"),
  },
  CONFLICT: {
    409: getErrorSchema(409, "Conflict"),
  },
  INTERNAL_ERROR: {
    500: getErrorSchema(500, "Internal Server Error"),
  },
  SHARED: {
    400: getErrorSchema(400, "Bad Request"),
    500: getErrorSchema(500, "Internal Server Error"),
  },
} as const;
