import { eventBus } from "./EventBus";
import { SystemStat } from "./models/SystemStat";

export const loadEventListeners = () => {
  eventBus.listen("CreateAddress", async () => {
    await SystemStat.incrementByName("total_addresses");
  });

  eventBus.listen("ParsedEmail", async () => {
    await SystemStat.incrementByName("total_emails");
  });

  eventBus.listen("UserRegistered", async () => {
    await SystemStat.incrementByName("total_users");
  });
};
