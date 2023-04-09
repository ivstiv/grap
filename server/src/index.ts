import { Model } from "objection";
import { db } from "./database/database";
import { loadEventListeners } from "./EventListeners";
import { EmailAddress } from "./models/EmailAddress";
import { smtpServer } from "./smtp-server";
import { getWebServer } from "./web-server";



Model.knex(db);

loadEventListeners();

const run = async () => {
  const webServer = await getWebServer();
  await webServer.ready();
  await webServer.listen({ port: 3000, host: "0.0.0.0" });

  smtpServer.listen(25, "0.0.0.0",
    () => console.log("SMTP Server listening on port 25...")
  );
};

setInterval(() => {
  void cleanupAddresses();
}, 1000 * 60 * 5);

const cleanupAddresses = async () => {
  console.log(new Date().toISOString(), "Address cleanup job running...");
  const addresses = await EmailAddress.query();
  const expiredAddrs = addresses.filter(a => a.expiresInMins() < 1);
  const deletionPromises = expiredAddrs.map(a => a.destroy());
  await Promise.all(deletionPromises);
  console.log(new Date().toISOString(), `${deletionPromises.length} addresses deleted.`);
};

void run();
