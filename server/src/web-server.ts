import Fastify from "fastify";
import view from "@fastify/view";
import ejs from "ejs";
import { loginRoutes } from "./routes/login";
import { rootRoutes } from "./routes/root";
import { setupRoutes } from "./routes/setup";


export const fastify = Fastify({
  logger: true,
});
  
fastify.register(view, {
  engine: { ejs },
});
  
fastify.register(rootRoutes);
fastify.register(setupRoutes, { prefix: "setup" });
fastify.register(loginRoutes, { prefix: "login" });
