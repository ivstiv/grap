import { FastifyHandler } from "./ControllerUtilities";


const index: FastifyHandler =
  async (req, res) => res.view("/src/views/new/index");


const login: FastifyHandler =
  async (req, res) => res.view("/src/views/new/login");

const register: FastifyHandler =
  async (req, res) => res.view("/src/views/new/register");

const setup: FastifyHandler =
  async (req, res) => res.view("/src/views/new/setup");


// compiles to a cleaner imports from TS with interop
// import * as SomeController - MESSY
// import SomeController - CLEAN
export default {
  index,
  login,
  register,
  setup,
};
