import { FastifyHandler } from "./ControllerUtilities";


const logout: FastifyHandler =
  async (req, res) => {
    if (req.session.user) {
      req.session.destroy();
    }
    return res.redirect("/login");
  };


// compiles to a cleaner imports from TS with interop
// import * as SomeController - MESSY
// import SomeController - CLEAN
export default {
  logout,
};
