import { FastifyHandler } from "./ControllerUtilities";


const index: FastifyHandler =
  async (req, res) => res.view("/src/views/new/index");


const login: FastifyHandler =
  async (req, res) => res.view("/src/views/new/login");

const register: FastifyHandler =
  async (req, res) => res.view("/src/views/new/register");

const setup: FastifyHandler =
  async (req, res) => res.view("/src/views/new/setup");

const documentation: FastifyHandler =
  async (req, res) => res.view("/src/views/new/documentation");

const badRequest: FastifyHandler =
  async (req, res) => res.view("/src/views/new/400");

const notFound: FastifyHandler =
  async (req, res) => res.view("/src/views/new/404");


// compiles to a cleaner imports from TS with interop
// import * as SomeController - MESSY
// import SomeController - CLEAN
export default {
  index,
  login,
  register,
  setup,
  documentation,
  badRequest,
  notFound,
};
