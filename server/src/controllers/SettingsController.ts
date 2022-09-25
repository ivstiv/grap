import { User } from "../models/User";
import { FastifyHandler, numericStringConstraint } from "./ControllerUtilities";
import { Role } from "../models/Role";
import { z } from "zod";


const index: FastifyHandler =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const user = await User.getById(req.session.user.id);

    const adminRole = await Role.getByName("admin");
    if(!adminRole) {
      throw new Error("Admin role not found.");
    }
    const admins = await adminRole.users();
    const isLastAdmin = admins.length === 1
      && admins.some(a => a.id === user.id);

    return res.view("/src/views/settings", {
      maxTokens: user.settings.maxTokens,
      isLastAdmin,
      tokens: user.tokens,
    });
  };


interface CreateTokenHandler {
  Body: {
    note: string
  }
}
const createToken: FastifyHandler<CreateTokenHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const schema = z.object({
      note: z.string({
        required_error: "Note is required",
        invalid_type_error: "Note must be a string",
      })
        .max(15, "Note must be at most 15 characters"),
    });

    // validate the submitted form
    const parsedBody = schema.safeParse(req.body);

    if (!parsedBody.success) {
      const { note } = parsedBody.error.flatten().fieldErrors;
      req.session.flashMessage = note?.at(0);
      return res.redirect("/settings");
    }

    const user = await User.getById(req.session.user.id);

    if (user.tokens.length >= user.settings.maxTokens) {
      req.session.flashMessage = "You have reached your token limit.";
      return res.redirect("/settings");
    }

    if (req.body.note) {
      await user.createToken(req.body.note);
    } else {
      await user.createToken();
    }

    req.session.flashMessage = "Access token created successfully!";
    return res.redirect("/settings");
  };


interface DestroyTokenHandler {
  Body: {
    token: string
  }
}
const destroyToken: FastifyHandler<DestroyTokenHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const schema = z.object({
      token: numericStringConstraint("token"),
    });

    // validate the submitted form
    const parsedBody = schema.safeParse(req.body);

    if (!parsedBody.success) {
      const { token } = parsedBody.error.flatten().fieldErrors;
      req.session.flashMessage = token?.at(0);
      return res.redirect("/settings");
    }

    const user = await User.getById(req.session.user.id);

    const tokenToDelete = user.tokens
      .find(t => t.id === parseInt(req.body.token));

    if (!tokenToDelete) {
      req.session.flashMessage = "You don't own the token you are trying to delete.";
      return res.redirect("/settings");
    }

    await tokenToDelete.destroy();

    req.session.flashMessage = "Access token deleted successfully!";
    return res.redirect("/settings");
  };


const destroyUser: FastifyHandler =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const user = await User.getById(req.session.user.id);
    await user.destroy();
    req.session.destroy();

    return res.redirect("/login");
  };


// compiles to a cleaner imports from TS with interop
// import * as SomeController - MESSY
// import SomeController - CLEAN
export default {
  index,
  createToken,
  destroyToken,
  destroyUser,
};
