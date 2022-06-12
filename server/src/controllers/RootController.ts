import { FastifyHandler } from "./ControllerUtilities";


export const index: FastifyHandler = 
  async (req, res) =>
    res.view("/src/views/pages/index.ejs", {
      isLoggedIn: !!req.session.user,
    });


export const about: FastifyHandler = 
    async (req, res) =>
      res.view("/src/views/pages/about.ejs", {
        isLoggedIn: !!req.session.user,
      });
