import { FastifyPluginCallback } from "fastify";

export const rootRoutes: FastifyPluginCallback =
(instance, _opts, next) => {
  instance.get("/", (_req, res) => {
    res.view("/src/views/pages/index.ejs", { text: "text" });
  });
  next();
};
