import { compare } from "bcrypt";
import { User } from "../models/User";
import {
  UserAccountFormHandler,
  userAccountSchema,
  FastifyHandler,
} from "./ControllerUtilities";


const show: FastifyHandler =
  async (_req, res) => res.view("/src/views/login");


const login: FastifyHandler<UserAccountFormHandler> =
  async (req, res) => {
    // validate the submitted form
    const parsedBody = userAccountSchema.safeParse(req.body);

    if (!parsedBody.success) {
      const {
        email,
        password,
      } = parsedBody.error.flatten().fieldErrors;
      req.session.flashMessage = email?.at(0) ?? password?.at(0);
      return res.redirect("/login");
    }

    const user = await User.getByEmail(req.body.email);

    if (!user) {
      req.session.flashMessage = "Wrong email or password.";
      return res.redirect("/login");
    }

    const isPasswordValid = await compare(req.body.password, user.password);
    if (!isPasswordValid) {
      req.session.flashMessage = "Wrong email or password.";
      return res.redirect("/login");
    }

    req.session.user = {
      id: user.id,
      isAdmin: user.hasRole("admin"),
    };

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


// compiles to a cleaner imports from TS with interop
// import * as SomeController - MESSY
// import SomeController - CLEAN
export default {
  show,
  login,
};
