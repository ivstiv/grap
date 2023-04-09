import type { Knex } from "knex";

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable("addresses", (table: Knex.TableBuilder) => {
    table.increments("id", { primaryKey: true });
    table.string("address").unique().notNullable();
    table.integer("owner").references("id").inTable("users");
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable("addresses");
};
