import { Knex } from "knex";

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable("stats", (table: Knex.TableBuilder) => {
    table.string("name").unique().notNullable();
    table.string("value").notNullable();
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable("stats");
};
