import { FastifyPluginCallback } from "fastify";

export const registerRoutes: FastifyPluginCallback =
(instance, _opts, next) => {
  instance.get("/", (req, res) => {
    res.view("/src/views/pages/register.ejs");
  });
  instance.post("/", (req, res) => {
    res.send(req.raw.method);
  });
  next();
};
