import { Model } from "objection";
import { db } from "../database/database";
import { loadEventListeners } from "../EventListeners";
import { SystemSetting } from "../models/SystemSetting";
import type { StatName } from "../models/SystemStat";
import { SystemStat } from "../models/SystemStat";
import { User } from "../models/User";
import { getWebServer } from "../web-server";


type WebServer = Awaited<ReturnType<typeof getWebServer>>;
export let testWebServer: WebServer;

export const mochaGlobalSetup = async () => {
  console.log("Global setup...");
  await db.migrate.rollback();
  await db.migrate.latest();
  await db.seed.run();
  Model.knex(db);
  loadEventListeners();
  testWebServer = await getWebServer();
};

export const mochaGlobalTeardown = async () => {
  console.log("Global teardown...");
  await db.migrate.rollback();
  await Model.knex().destroy();
};

export const systemCleanup = async () => {
  const users = await User.query()
    .withGraphFetched("[roles, tokens, addresses, settings]");
  const userDeletionPromises = users.map(u => u.destroy());
  await Promise.all([
    ...userDeletionPromises,
    SystemStat.updateByName("total_users", "0"),
    SystemStat.updateByName("total_emails", "0"),
    SystemStat.updateByName("total_addresses", "0"),
    SystemSetting.updateByName("disable_docs_page", "false"),
    SystemSetting.updateByName("disable_index_page", "false"),
    SystemSetting.updateByName("disable_register_page", "false"),
  ]);
};

export const sleep = (ms: number) =>
  new Promise(r => setTimeout(r, ms));

export const waitForStatToUpdate = async (name: StatName) => {
  const initialStat = await SystemStat.getByName(name);
  let latestStat = initialStat;

  // 10 sec timeout
  const forceStopAt = Date.now() + 1000 * 10;
  while (initialStat.value === latestStat.value) {
    if (Date.now() > forceStopAt) {
      throw new Error(`System stat did not change ${name}`);
    }

    latestStat = await SystemStat.getByName(name);
    await sleep(200);
  }
  return latestStat;
};

export type Cookie = {
  name: string
  value: string
  path: string
  httpOnly: boolean
  sameSite: string
};
