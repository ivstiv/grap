import { FastifyHandler } from "./ControllerUtilities";


export const index: FastifyHandler = 
  async (req, res) =>
    res.view("/src/views/pages/dashboard.ejs", {
      isLoggedIn: !!req.session.user,
    });
