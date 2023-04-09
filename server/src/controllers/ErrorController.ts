import type { FastifyHandler } from "./ControllerUtilities";


const notFound: FastifyHandler =
  async (_req, res) => res.code(404).view("/src/views/404");


// compiles to a cleaner imports from TS with interop
// import * as SomeController - MESSY
// import SomeController - CLEAN
export default {
  notFound,
};
