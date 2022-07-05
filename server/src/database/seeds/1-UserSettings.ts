import { Knex } from "knex";
import { Model } from "objection";
import { User } from "../../models/User";
import { UserSettings } from "../../models/UserSettings";

export const seed = async (knex: Knex) => {
  Model.knex(knex);

  console.log("Seeding missing user settings...");
  const usersWithoutSettings = await (
    await User.query()
      .withGraphFetched("[settings]")
  ).filter(u => u.settings === null);

  const promises = usersWithoutSettings.map(u =>
    UserSettings.query().insert({ user: u.id })
  );

  await Promise.all(promises);
  console.log(`Seeded ${promises.length} users.`);
};
