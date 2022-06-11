import { FastifyPluginCallback } from "fastify";

export const setupRoutes: FastifyPluginCallback =
(instance, _opts, next) => {
  instance.get("/", (req, res) => {
    res.view("/src/views/pages/setup.ejs");
  });
  instance.post("/", (req, res) => {
    res.send(req.raw.method);
  });
  next();
};
