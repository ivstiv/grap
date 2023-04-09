import type { Knex } from "knex";
import { Model } from "objection";
import { Role } from "../../models/Role";

export const seed = async (knex: Knex) => {
  Model.knex(knex);

  console.log("Seeding roles...");

  await Role.query().delete();


  await Promise.all([
    Role.query().insert({ id: 1, name: "user" }),
    Role.query().insert({ id: 2, name: "admin" }),
  ]);

  const roles = await Role.query();
  if (roles.length < 2) {
    throw new Error("Role seeding failed!");
  } else {
    console.log(`Seeded ${roles.length} roles.`);
  }
};
