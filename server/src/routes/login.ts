import { compare } from "bcrypt";
import { FastifyPluginCallback } from "fastify";
import { User } from "../models/User";
import { UserAccountFormHandler, userAccountSchema } from "./shared";


export const loginRoutes: FastifyPluginCallback =
(instance, _opts, next) => {
  instance.get("/", (req, res) => {
    res.view("/src/views/pages/login.ejs");
  });
  instance.post<UserAccountFormHandler>("/", 
    async (req, res) => {
      // validate the submitted form
      const errors = await userAccountSchema.validate(req.body)
        .then(() => [])
        .catch(e => e.errors);

      if (errors.length > 0) {
        return res.view("/src/views/pages/login.ejs", { error: errors[0] });
      }

      const user = await User.getByEmail(req.body.email);

      if (!user) {
        return res.view("/src/views/pages/login.ejs", { error: "Wrong email or password." });
      }

      const isPasswordValid = await compare(req.body.password, user.password);
      if (!isPasswordValid) {
        return res.view("/src/views/pages/login.ejs", { error: "Wrong email or password." });
      }

      // TO-DO: log the user in
      req.session.user = { id: user.id };
      return res.redirect("/dashboard");
    });
  next();
};
