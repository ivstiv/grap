import { SettingName, SystemSetting } from "../models/SystemSetting";
import { User } from "../models/User";
import { FastifyHandler } from "./ControllerUtilities";
import * as yup from "yup";
import { SystemStat } from "../models/SystemStat";
import { EmailAddress } from "../models/EmailAddress";
import { Email } from "../models/Email";



export const index: FastifyHandler = 
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const [
      user,
      settings,
      stats,
      { userCount },
      { addressCount },
      { emailCount },
    ] = await Promise.all([
      User.getById(req.session.user.id),
      SystemSetting.getAll(),
      SystemStat.getAll(),
      User.query().count("id as userCount").first() as unknown as Promise<{userCount: number}>,
      EmailAddress.query().count("id as addressCount").first() as unknown as Promise<{addressCount: number}>,
      Email.query().count("id as emailCount").first() as unknown as Promise<{emailCount: number}>,
    ]);

    const mashedStats = [
      ...stats,
      { name: "active_users", value: userCount },
      { name: "active_addresses", value: addressCount },
      { name: "active_emails", value: emailCount },
    ];

    const roles = await user.roles();

    const flashMessage = req.session.flashMessage;
    req.session.flashMessage = undefined; // reset the variable

    return res.view("/src/views/pages/system-settings.ejs", {
      isLoggedIn: true,
      isAdmin: roles.includes("admin"),
      flashMessage,
      settings,
      stats: mashedStats,
    });
  };


interface SystemSettingsHandler {
  Body: {
    disable_register_page: "true" | "false",
    disable_index_page: "true" | "false",
    disable_about_page: "true" | "false",
  }
}
export const updateSettings: FastifyHandler<SystemSettingsHandler> = 
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const constraint = yup.string().oneOf(["false", "true"]).required();

    const schema = yup.object().shape({
      disable_register_page: constraint,
      disable_index_page: constraint,
      disable_about_page: constraint,
    });

    // validate the submitted form
    const errors = await schema.validate(req.body)
      .then(() => [])
      .catch(e => e.errors);

    if (errors.length > 0) {
      req.session.flashMessage = errors[0];
      return res.redirect("/system-settings");
    }

    const updatePromises = Object.entries(req.body)
      .map(([key, value]) =>
        SystemSetting.updateByName(key as SettingName, value),
      );

    await Promise.all(updatePromises);

    req.session.flashMessage = "System settings updated!";
    return res.redirect("/system-settings");
  };
