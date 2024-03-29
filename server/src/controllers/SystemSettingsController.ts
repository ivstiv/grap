import type { SettingName } from "../models/SystemSetting";
import { SystemSetting } from "../models/SystemSetting";
import { User } from "../models/User";
import type { FastifyHandler } from "./ControllerUtilities";
import { SystemStat } from "../models/SystemStat";
import { EmailAddress } from "../models/EmailAddress";
import { Email } from "../models/Email";
import { z } from "zod";


const index: FastifyHandler =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const [
      settings,
      stats,
      { userCount },
      { addressCount },
      { emailCount },
    ] = await Promise.all([
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

    return res.view("/src/views/system-settings", {
      settings,
      stats: mashedStats,
    });
  };


interface SystemSettingsHandler {
  Body: {
    disable_register_page: "true" | "false",
    disable_index_page: "true" | "false",
    disable_docs_page: "true" | "false",
  }
}
const updateSettings: FastifyHandler<SystemSettingsHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const constraint = (name: string) => z
      .string({
        required_error: `${name} is required`,
        invalid_type_error: `${name} must be a string`,
      })
      .refine(
        val => ["true", "false"].includes(val),
        `${name} must have a value of true or false.`
      );

    const schema = z.object({
      disable_register_page: constraint("disable_register_page"),
      disable_index_page: constraint("disable_index_page"),
      disable_docs_page: constraint("disable_docs_page"),
    });

    // validate the submitted form
    const parsedBody = schema.safeParse(req.body);

    if (!parsedBody.success) {
      const {
        disable_docs_page,
        disable_index_page,
        disable_register_page,
      } = parsedBody.error.flatten().fieldErrors;
      req.session.flashMessage =
        disable_docs_page?.at(0) ??
        disable_index_page?.at(0) ??
        disable_register_page?.at(0);
      return res.redirect("/admin/system-settings");
    }

    const updatePromises = Object.entries(req.body)
      .map(([key, value]) =>
        SystemSetting.updateByName(key as SettingName, value),
      );

    await Promise.all(updatePromises);

    req.session.flashMessage = "System settings updated!";
    return res.redirect("/admin/system-settings");
  };


// compiles to a cleaner imports from TS with interop
// import * as SomeController - MESSY
// import SomeController - CLEAN
export default {
  index,
  updateSettings,
};
