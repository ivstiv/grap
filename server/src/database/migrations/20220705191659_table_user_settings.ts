import { Knex } from "knex";

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable("user_settings", (table: Knex.TableBuilder) => {
    table.integer("user").references("id").inTable("users");
    table.integer("maxEmailAddresses").notNullable().defaultTo(10);
    table.integer("maxTokens").notNullable().defaultTo(5);
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable("user_settings");
};
