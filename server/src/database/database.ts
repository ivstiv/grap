import { Knex, knex } from "knex";

const { DATABASE_PATH } = process.env;

if (!DATABASE_PATH) {
  throw new Error("Missing env variable: DATABASE_PATH");
}

export const dbConfig: Knex.Config = {
  client: "sqlite3",
  useNullAsDefault: true,
  connection: {
    filename: DATABASE_PATH,
  },
  migrations: {
    directory: `${__dirname}/migrations`,
  },
  seeds: {
    directory: `${__dirname}/seeds`,
  },
};

export const db = knex(dbConfig);
