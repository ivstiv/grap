import { eventBus } from "../EventBus";
import { User } from "../models/User";
import {
  UserAccountFormHandler,
  FastifyHandler,
  userAccountSchema,
} from "./ControllerUtilities";


export const show: FastifyHandler = 
  async (_req, res) => res.view("/src/views/pages/register.ejs");


export const register: FastifyHandler<UserAccountFormHandler> = 
  async (req, res) => {
    // validate the submitted form
    const errors = await userAccountSchema.validate(req.body)
      .then(() => [])
      .catch(e => e.errors);

    if (errors.length > 0) {
      return res.view("/src/views/pages/register.ejs", { error: errors[0] });
    }

    const userWithTheSameEmail = await User.getByEmail(req.body.email);

    if (userWithTheSameEmail) {
      return res.view("/src/views/pages/register.ejs", { error: "User with that email already exists." });
    }

    const user = await User.register(req.body.email, req.body.password);
    eventBus.emit({
      type: "UserRegistered",
      detail: {
        user,
      },
    });

    req.session.user = { id: user.id };
    return res.redirect("/dashboard");
  };
