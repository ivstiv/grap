import type { Knex } from "knex";

export const up = async (knex: Knex): Promise<void> => {
  await knex("settings").where("name", "disable_about_page").delete();
};

export const down = async (knex: Knex): Promise<void> => {
  await knex("settings").where("name", "disable_docs_page").delete();
};
