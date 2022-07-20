import { User } from "../models/User";
import { FastifyHandler } from "./ControllerUtilities";
import * as yup from "yup";

const PAGE_SIZE = 10;

interface IndexUsersHandler {
  Querystring: {
    page: string
  }
}
export const index: FastifyHandler<IndexUsersHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const user = await User.getById(req.session.user.id);

    const schema = yup.object().shape({
      page: yup.number().min(1).max(50).required(),
    });

    // validate the submitted form
    const errors = await schema.validate(req.query)
      .then(() => [])
      .catch(e => e.errors);

    if (errors.length > 0) {
      req.session.flashMessage = errors[0];
      return res.redirect("/404");
    }

    const currentPage = parseInt(req.query.page);

    const userList = await User.query()
      .withGraphFetched("[roles, tokens, addresses, settings]")
      .page(currentPage-1, PAGE_SIZE); // pages start from 0

    const totalPages = Math.ceil(userList.total/PAGE_SIZE);

    const flashMessage = req.session.flashMessage;
    req.session.flashMessage = undefined; // reset the variable

    return res.view("/src/views/pages/users.ejs", {
      flashMessage,
      users: userList.results,
      isLoggedIn: !!req.session.user,
      isAdmin: user.hasRole("admin"),
      totalPages,
      currentPage,
      prevPage: currentPage > 1 ? currentPage - 1 : currentPage,
      nextPage: totalPages > currentPage ? currentPage + 1 : currentPage,
    });
  };


interface UpdateUserHandler {
  Body: {
    maxEmails: string
    user: string
  }
}
export const updateUser: FastifyHandler<UpdateUserHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const schema = yup.object().shape({
      maxEmails: yup.number().min(1).max(300).required(),
      user: yup.number().min(1).required(),
    });

    // validate the submitted form
    const errors = await schema.validate(req.body)
      .then(() => [])
      .catch(e => e.errors);

    if (errors.length > 0) {
      req.session.flashMessage = errors[0];
      return res.redirect("/admin/users?page=1");
    }

    const parsedMaxEmails = parseInt(req.body.maxEmails);
    const userToUpdate = await User.getById(parseInt(req.body.user));

    if (!userToUpdate) {
      req.session.flashMessage = "User not found";
      return res.redirect("/admin/users?page=1");
    }

    await userToUpdate.settings.$query().update({
      maxEmailAddresses: parsedMaxEmails,
    });

    req.session.flashMessage = "User updated successfully!";
    return res.redirect("/admin/users?page=1");
  };
