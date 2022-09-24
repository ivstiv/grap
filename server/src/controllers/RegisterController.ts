import { User } from "../models/User";
import {
  UserAccountFormHandler,
  FastifyHandler,
  userAccountSchema,
} from "./ControllerUtilities";


const show: FastifyHandler =
  async (_req, res) => res.view("/src/views/register");


const register: FastifyHandler<UserAccountFormHandler> =
  async (req, res) => {
    // validate the submitted form
    const parsedBody = userAccountSchema.safeParse(req.body);

    if (!parsedBody.success) {
      const {
        email,
        password,
      } = parsedBody.error.flatten().fieldErrors;
      req.session.flashMessage = email?.at(0) ?? password?.at(0);
      return res.redirect("/register");
    }

    const userWithTheSameEmail = await User.getByEmail(req.body.email);

    if (userWithTheSameEmail) {
      req.session.flashMessage = "User with that email already exists.";
      return res.redirect("/register");
    }

    const user = await User.register(req.body.email, req.body.password);

    if (!user) {
      throw new Error("Failed to register user.");
    }

    req.session.user = {
      id: user.id,
      isAdmin: user.hasRole("admin"),
    };
    return res.redirect("/dashboard");
  };


// compiles to a cleaner imports from TS with interop
// import * as SomeController - MESSY
// import SomeController - CLEAN
export default {
  show,
  register,
};
