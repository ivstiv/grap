import { User } from "../models/User";
import { FastifyHandler } from "./ControllerUtilities";
import * as yup from "yup";

const PAGE_SIZE = 10;

interface IndexUsersHandler {
  Querystring: {
    page: number
  }
} 
export const index: FastifyHandler<IndexUsersHandler> = 
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const user = await User.getById(req.session.user.id);

    const [
      userList,
    ] = await Promise.all([
      User.query().page(req.query.page-1, PAGE_SIZE), // pages start from 0
    ]);

    const totalPages = Math.ceil(userList.total/PAGE_SIZE);

    const schema = yup.object().shape({
      page: yup.number().min(1).max(totalPages).required(),
    });

    // validate the submitted form
    const errors = await schema.validate(req.query)
      .then(() => [])
      .catch(e => e.errors);

    if (errors.length > 0) {
      req.session.flashMessage = errors[0];
    }

    const flashMessage = req.session.flashMessage;
    req.session.flashMessage = undefined; // reset the variable

    return res.view("/src/views/pages/users.ejs", {
      flashMessage,
      users: userList.results,
      isLoggedIn: !!req.session.user,
      isAdmin: user.hasRole("admin"),
    });
  };
