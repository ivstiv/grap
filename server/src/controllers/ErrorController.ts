import { User } from "../models/User";
import { FastifyHandler } from "./ControllerUtilities";


export const notFound: FastifyHandler = 
  async (req, res) => {
    let isAdmin = false;
    if (req.session.user) {
      const user = await User.getById(req.session.user.id);
      isAdmin = user.hasRole("admin");
    }

    const flashMessage = req.session.flashMessage;
    req.session.flashMessage = undefined; // reset the variable

    return res
      .code(404)
      .view("/src/views/pages/404.ejs", {
        isAdmin,
        flashMessage,
        isLoggedIn: !!req.session.user,
      });
  };
