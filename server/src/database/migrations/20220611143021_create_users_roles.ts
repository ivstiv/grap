import type { Knex } from "knex";

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable("users_roles", (table: Knex.TableBuilder) => {
    table.integer("user").references("id").inTable("users");
    table.integer("role").references("id").inTable("roles");
    table.primary(["user", "role"]);
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable("users_roles");
};
