import { User } from "../models/User";
import { FastifyHandler } from "./ControllerUtilities";
import * as yup from "yup";
import { Role } from "../models/Role";


export const index: FastifyHandler =
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

    const flashMessage = req.session.flashMessage;
    req.session.flashMessage = undefined; // reset the variable

    return res.view("/src/views/pages/settings.ejs", {
      isLoggedIn: true,
      isAdmin: user.hasRole("admin"),
      maxTokens: user.settings.maxTokens,
      isLastAdmin,
      tokens: user.tokens,
      flashMessage,
    });
  };


interface CreateTokenHandler {
  Body: {
    note: string
  }
}
export const createToken: FastifyHandler<CreateTokenHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const schema = yup.object().shape({
      note: yup.string().max(15),
    });

    // validate the submitted form
    const errors = await schema.validate(req.body)
      .then(() => [])
      .catch(e => e.errors);

    if (errors.length > 0) {
      req.session.flashMessage = errors[0];
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
export const destroyToken: FastifyHandler<DestroyTokenHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const schema = yup.object().shape({
      token: yup.number().min(1).required(),
    });

    // validate the submitted form
    const errors = await schema.validate(req.body)
      .then(() => [])
      .catch(e => e.errors);

    if (errors.length > 0) {
      req.session.flashMessage = errors[0];
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


export const destroyUser: FastifyHandler =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const user = await User.getById(req.session.user.id);
    await user.destroy();
    req.session.destroy();

    return res.redirect("/login");
  };
