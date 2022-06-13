import { Knex } from "knex";

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable("emails", (table: Knex.TableBuilder) => {
    table.increments("id", { primaryKey: true });
    table.integer("address").references("id").inTable("addresses");
    table.string("from");
    table.string("subject");
    table.text("content");
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable("emails");
};
