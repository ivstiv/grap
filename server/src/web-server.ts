import Fastify from "fastify";
import view from "@fastify/view";
import ejs from "ejs";
import { loginRoutes } from "./routes/login";
import { rootRoutes } from "./routes/root";
import { setupRoutes } from "./routes/setup";
import formBodyPlugin from "@fastify/formbody";
import { registerRoutes } from "./routes/register";
import { dashboardRoutes } from "./routes/dashboard";
import fastifyCookiePlugin from "@fastify/cookie";
import fastifySessionPlugin from "@fastify/session";
import { logoutRoutes } from "./routes/logout";
import * as ErrorController from "./controllers/ErrorController";


declare module "fastify" {
  interface Session {
      user?: {
        id: number
      }
  }
}

const { SESSION_SECRET, NODE_ENV } = process.env;

if (!SESSION_SECRET) {
  throw new Error("Missing env variable: SESSION_SECRET");
}

export const fastify = Fastify({
  logger: true,
});

fastify.register(formBodyPlugin);
fastify.register(fastifyCookiePlugin);
fastify.register(fastifySessionPlugin, {
  secret: SESSION_SECRET,
  cookie: {
    secure: NODE_ENV === "development" ? false : true,
  },
});
  
fastify.register(view, {
  engine: { ejs },
});
  
fastify.register(rootRoutes);
fastify.register(setupRoutes, { prefix: "setup" });
fastify.register(loginRoutes, { prefix: "login" });
fastify.register(logoutRoutes, { prefix: "logout" });
fastify.register(registerRoutes, { prefix: "register" });
fastify.register(dashboardRoutes, { prefix: "dashboard" });

fastify.setNotFoundHandler(ErrorController.notFound);
