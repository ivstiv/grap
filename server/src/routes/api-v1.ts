import { FastifyPluginCallback } from "fastify";
import * as ApiController from "../controllers/ApiV1Controller";


export const apiV1Routes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.addHook("preHandler",
      (req, res, done) => {
        if (!req.session.user) {
          return res.code(403).send("Unauthorized");
        }
        done();
      }
    );

    instance.get("/address", ApiController.createAddress);
    next();
  };
