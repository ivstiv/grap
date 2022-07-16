import { Model } from "objection";
import { db } from "../database/database";
import { loadEventListeners } from "../EventListeners";
import { StatName, SystemStat } from "../models/SystemStat";

export const mochaGlobalSetup = async () => {
  console.log("Global setup...");
  await db.migrate.rollback();
  await db.migrate.latest();
  await db.seed.run();
  Model.knex(db);
  loadEventListeners();
};

export const mochaGlobalTeardown = async () => {
  console.log("Global teardown...");
  await db.migrate.rollback();
  Model.knex().destroy();
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
    sleep(200);
  }
  return latestStat;
};


export type Cookie = {
  name: string
  value: string
  path: string
  httpOnly: boolean
  sameSite: string
}
