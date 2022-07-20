import { compare } from "bcrypt";
import { User } from "../models/User";
import {
  UserAccountFormHandler,
  userAccountSchema,
  FastifyHandler,
} from "./ControllerUtilities";


export const show: FastifyHandler =
  async (_req, res) => res.view("/src/views/pages/login.ejs");


export const login: FastifyHandler<UserAccountFormHandler> =
  async (req, res) => {
    // validate the submitted form
    const errors = await userAccountSchema.validate(req.body)
      .then(() => [])
      .catch(e => e.errors);

    if (errors.length > 0) {
      return res
        .code(400)
        .view("/src/views/pages/login.ejs", { error: errors[0] });
    }

    const user = await User.getByEmail(req.body.email);

    if (!user) {
      return res
        .code(400)
        .view("/src/views/pages/login.ejs", { error: "Wrong email or password." });
    }

    const isPasswordValid = await compare(req.body.password, user.password);
    if (!isPasswordValid) {
      return res
        .code(400)
        .view("/src/views/pages/login.ejs", { error: "Wrong email or password." });
    }

    req.session.user = { id: user.id };

    if (process.env.NODE_ENV === "test") {
      return res
        .cookie("sessionId", req.session.encryptedSessionId, {
          domain: req.session.cookie.domain,
          expires: req.session.cookie.expires,
          secure: req.session.cookie.secure as boolean,
          httpOnly: req.session.cookie.httpOnly,
          maxAge: req.session.cookie.maxAge,
          path: req.session.cookie.path,
          sameSite: req.session.cookie.sameSite,
        })
        .redirect("/dashboard");
    }
    return res.redirect("/dashboard");
  };
