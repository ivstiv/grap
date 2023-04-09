import { Role } from "../models/Role";
import { User } from "../models/User";
import { numOfAdmins } from "../utilities/functions";
import type {
  UserAccountFormHandler,
  FastifyHandler } from "./ControllerUtilities";
import {
  userAccountSchema,
} from "./ControllerUtilities";


const show: FastifyHandler =
  async (_req, res) => res.view("/src/views/setup");


const createAdmin: FastifyHandler<UserAccountFormHandler> =
  async (req, res) => {
    // only handle this if there are no admins yet
    if(await numOfAdmins() > 0) {
      return res.redirect("/");
    }

    // validate the submitted form
    const parsedBody = userAccountSchema.safeParse(req.body);

    if (!parsedBody.success) {
      const {
        email,
        password,
      } = parsedBody.error.flatten().fieldErrors;
      req.session.flashMessage = email?.at(0) ?? password?.at(0);
      return res.redirect("/setup");
    }

    const userWithTheSameEmail = await User.getByEmail(req.body.email);

    if (userWithTheSameEmail) {
      req.session.flashMessage = "User with that email already exists.";
      return res.redirect("/setup");
    }

    const adminRole = await Role.getByName("admin");
    if (!adminRole) {
      throw new Error("Missing admin role!");
    }

    let user = await User.register(req.body.email, req.body.password);
    if (!user) {
      throw new Error("Failed to register user.");
    }
    await user.$relatedQuery<Role>("roles").relate(adminRole);
    user = await user.refresh();

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
  createAdmin,
};
