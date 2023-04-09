import type { Knex } from "knex";
import { knex } from "knex";
import { env } from "../env";



export const dbConfig: Knex.Config = {
  client: "sqlite3",
  useNullAsDefault: true,
  connection: {
    filename: env.DATABASE_PATH,
  },
  migrations: {
    directory: `${__dirname}/migrations`,
  },
  seeds: {
    directory: `${__dirname}/seeds`,
  },
};

export const db = knex(dbConfig);
