import type { FastifyPluginCallback } from "fastify";
import { numOfAdmins } from "../utilities/functions";
import SetupController from "../controllers/SetupController";


export const setupRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.addHook("preHandler",
      async (_req, res) => {
        // only handle this if there are no admins yet
        if(await numOfAdmins() > 0) {
          return res.redirect("/");
        }
      }
    );

    instance.get("/", SetupController.show);
    instance.post("/", SetupController.createAdmin);
    next();
  };
