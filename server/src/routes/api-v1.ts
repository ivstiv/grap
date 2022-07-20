import { FastifyPluginCallback } from "fastify";
import * as ApiController from "../controllers/ApiV1Controller";
import { Token } from "../models/Token";


export const apiV1Routes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.addHook("preHandler",
      async (req, res) => {
        const hasUser = !!req.session.user;
        let hasValidToken = false;

        if (req.headers.authorization) {
          const validFormat = /^Bearer\s[a-z0-9]+$/.test(req.headers.authorization);
          if (!validFormat) {
            return res.code(401)
              .send({ error: "Invalid header format. Expecting 'Authorization: Bearer token'." });
          }
          const [_bearer, token] = req.headers.authorization.split(" ");
          hasValidToken = await Token.isTokenValid(token);
        }

        if (!hasUser && !hasValidToken) {
          return res.code(403).send("Unauthorized");
        }
      }
    );

    instance.get("/address", ApiController.createAddress);
    instance.get("/inbox/:address/latest", ApiController.latestEmail);
    next();
  };
