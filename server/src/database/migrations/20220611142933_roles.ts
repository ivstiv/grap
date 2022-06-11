import { Knex } from "knex";

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable("roles", (table: Knex.TableBuilder) => {
    table.increments("id", { primaryKey: true });
    table.string("name").unique().notNullable();
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable("roles");
};
