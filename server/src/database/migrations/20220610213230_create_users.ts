import { Knex } from "knex";

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable("users", (table: Knex.TableBuilder) => {
    table.increments("id", { primaryKey: true });
    table.string("email").unique().notNullable();
    table.string("password").notNullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable("users");
};
