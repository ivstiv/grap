import { User } from "../models/User";
import type { FastifyHandler } from "./ControllerUtilities";
import { numericStringConstraint } from "./ControllerUtilities";
import { z } from "zod";


const PAGE_SIZE = 10;
interface IndexUsersHandler {
  Querystring: {
    page: string
  }
}
const index: FastifyHandler<IndexUsersHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const schema = z.object({
      page: numericStringConstraint("page"),
    });

    // validate the submitted form
    const parsedBody = schema.safeParse(req.query);

    if (!parsedBody.success) {
      const { page } = parsedBody.error.flatten().fieldErrors;
      req.session.flashMessage = page?.at(0);
      return res.redirect("/404");
    }

    const currentPage = parseInt(req.query.page);

    const userList = await User.query()
      .withGraphFetched("[roles, tokens, addresses, settings]")
      .page(currentPage-1, PAGE_SIZE); // pages start from 0

    const totalPages = Math.ceil(userList.total/PAGE_SIZE);

    return res.view("/src/views/users", {
      users: userList.results,
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
const updateUser: FastifyHandler<UpdateUserHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const schema = z.object({
      user: numericStringConstraint("user"),
      maxEmails: numericStringConstraint("maxEmails"),
    });

    // validate the submitted form
    const parsedBody = schema.safeParse(req.body);

    if (!parsedBody.success) {
      const { maxEmails, user } = parsedBody.error.flatten().fieldErrors;
      req.session.flashMessage = user?.at(0) ?? maxEmails?.at(0);
      return res.redirect("/admin/users?page=1");
    }

    const parsedMaxEmails = parseInt(req.body.maxEmails);

    let userToUpdate;
    try {
      userToUpdate = await User.getById(parseInt(req.body.user));
    } catch(err) {
      if (!(err instanceof Error) || !err.message.includes("not found")) {
        throw err;
      }
    }

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


// compiles to a cleaner imports from TS with interop
// import * as SomeController - MESSY
// import SomeController - CLEAN
export default {
  index,
  updateUser,
};
