import { FastifyHandler } from "./ControllerUtilities";


export const notFound: FastifyHandler = 
  async (req, res) =>
    res.view("/src/views/pages/404.ejs", {
      isLoggedIn: !!req.session.user,
    });
