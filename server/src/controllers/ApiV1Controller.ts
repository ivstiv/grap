import type { FastifyInstance } from "fastify";
import { Token } from "../models/Token";
import { User } from "../models/User";
import { Responses } from "./ControllerUtilities";
import { successResponse } from "./ControllerUtilities";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";



const createAddress = (webServer: FastifyInstance) => {
  webServer.withTypeProvider<ZodTypeProvider>()
    .route({
      method: "GET",
      url: "/address",
      schema: {
        response: {
          201: successResponse(z.string()),
          ...Responses.SHARED,
          ...Responses.CONFLICT,
          ...Responses.UNAUTHORISED,
        },
        summary: "Generate a temporary email address",
        tags: ["address"],
      },
      handler: async (req, res) => {
        let user: User | undefined;
        if (req.session.user) {
          user = await User.getById(req.session.user.id);
        }

        if (req.headers.authorization) {
          const [_bearer, token] = req.headers.authorization.split(" ");
          const fetchedToken = await Token.query()
            .where({ token }).first();
          if (!fetchedToken) {
            return res.code(403).send({
              statusCode: 403,
              error: "Unauthorised",
              message: "Invalid token!",
            });
          }
          user = await fetchedToken.getOwner();
        }

        if (!user) {
          throw new Error("User not found!");
        }

        if (user.settings.maxEmailAddresses <= user.addresses.length) {
          return res.code(409).send({
            statusCode: 409,
            error: "Conflict",
            message: "Address limit reached! Try again later.",
          });
        }

        const { address } = await user.createEmailAddress();
        return res.code(201).send({ data: address });
      },
    });
};



const latestEmail = (webServer: FastifyInstance) => {
  webServer.withTypeProvider<ZodTypeProvider>()
    .route({
      method: "GET",
      url: "/inbox/:address/latest",
      schema: {
        params: z.object({
          address: z.string().nonempty(),
        }),
        response: {
          201: successResponse(
            z.object({
              subject: z.string().optional(),
              content: z.string().optional(),
              from: z.string().optional(),
              createdAt: z.string().optional(),
            })
          ),
          ...Responses.SHARED,
          ...Responses.NOT_FOUND,
          ...Responses.UNAUTHORISED,
        },
        summary: "Get the latest email for an address",
        tags: ["address"],
      },
      handler: async (req, res) => {
        let user: User | undefined;

        if (req.session.user) {
          // not event used by the frontend but to keep them consistent
          user = await User.getById(req.session.user.id);
        }

        if (req.headers.authorization) {
          const [_bearer, token] = req.headers.authorization.split(" ");
          const fetchedToken = await Token.query()
            .where({ token }).first();
          if (!fetchedToken) {
            return res.code(403).send({
              statusCode: 403,
              error: "Unauthorised",
              message: "Invalid token!",
            });
          }
          user = await fetchedToken.getOwner();
        }

        if (!user) {
          throw new Error("User not found!");
        }

        const addressToPoll = user.addresses
          .find(a => a.address === req.params.address);

        if(!addressToPoll) {
          return res.code(404).send({
            statusCode: 404,
            error: "Not Found",
            message: "Address not found!",
          });
        }

        const emails = await addressToPoll.getEmails();

        const latestEmail = emails.sort((a, b) => b.id - a.id).shift();

        if (!latestEmail) {
          return res.code(200).send({ data: {} });
        }

        return res.code(200).send({
          data: {
            subject: latestEmail.subject,
            content: latestEmail.content,
            from: latestEmail.from,
            createdAt: latestEmail.createdAt,
          },
        });
      },
    });
};


// compiles to a cleaner imports from TS with interop
// import * as SomeController - MESSY
// import SomeController - CLEAN
export default {
  createAddress,
  latestEmail,
};
