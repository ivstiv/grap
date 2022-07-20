import { FastifyHandler } from "./ControllerUtilities";


export const logout: FastifyHandler =
  async (req, res) => {
    if (req.session.user) {
      req.session.destroy();
    }
    return res.redirect("/dashboard");
  };
