import { SystemSetting } from "../models/SystemSetting";
import type { FastifyHandler } from "./ControllerUtilities";


const index: FastifyHandler =
  async (req, res) => {
    const setting = await SystemSetting.getByName("disable_index_page");
    if (setting.value === "true") {
      return res.redirect("/login");
    }

    return res.view("/src/views/index");
  };


const documentation: FastifyHandler =
  async (_req, res) => res.view("/src/views/documentation");


// compiles to a cleaner imports from TS with interop
// import * as SomeController - MESSY
// import SomeController - CLEAN
export default {
  index,
  documentation,
};
