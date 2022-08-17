import { SystemSetting } from "../models/SystemSetting";
import { User } from "../models/User";
import { FastifyHandler } from "./ControllerUtilities";


const index: FastifyHandler =
  async (req, res) => {
    const setting = await SystemSetting.getByName("disable_index_page");
    if (setting.value === "true") {
      return res.redirect("/login");
    }

    let isAdmin = false;
    if (req.session.user) {
      const user = await User.getById(req.session.user.id);
      isAdmin = user.hasRole("admin");
    }

    return res.view("/src/views/pages/index.ejs", {
      isLoggedIn: !!req.session.user,
      isAdmin,
      domain: process.env.DOMAIN ?? "Missing domain!",
    });
  };


const about: FastifyHandler =
  async (req, res) => {
    const setting = await SystemSetting.getByName("disable_about_page");
    if (setting.value === "true") {
      return res.redirect("/login");
    }

    let isAdmin = false;
    if (req.session.user) {
      const user = await User.getById(req.session.user.id);
      isAdmin = user.hasRole("admin");
    }

    return res.view("/src/views/pages/about.ejs", {
      isLoggedIn: !!req.session.user,
      isAdmin,
      domain: process.env.DOMAIN ?? "Missing domain!",
    });
  };


const docs: FastifyHandler =
  async (req, res) => {
    let isAdmin = false;
    if (req.session.user) {
      const user = await User.getById(req.session.user.id);
      isAdmin = user.hasRole("admin");
    }

    return res.view("/src/views/pages/docs.ejs", {
      isLoggedIn: !!req.session.user,
      isAdmin,
      domain: process.env.DOMAIN ?? "Missing domain!",
    });
  };


// compiles to a cleaner imports from TS with interop
// import * as SomeController - MESSY
// import SomeController - CLEAN
export default {
  index,
  about,
  docs,
};
