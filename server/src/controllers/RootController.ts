import { SystemSetting } from "../models/SystemSetting";
import { User } from "../models/User";
import { FastifyHandler } from "./ControllerUtilities";


export const index: FastifyHandler = 
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


export const about: FastifyHandler = 
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
      
