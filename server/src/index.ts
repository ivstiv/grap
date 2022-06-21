import { Model } from "objection";
import { db } from "./database/database";
import { EmailAddress } from "./models/EmailAddress";
import { smtpServer } from "./smtp-server";
import { fastify } from "./web-server";

Model.knex(db);

fastify.listen({ port: 3000, host: "0.0.0.0" },
  (err, _address) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  });
  
smtpServer.listen(25, "0.0.0.0", 
  () => console.log("SMTP Server listening on port 25...")
);


setInterval(async () => {
  console.log(new Date().toISOString(), "Address cleanup job running...");
  const addresses = await EmailAddress.query();
  const expiredAddrs = addresses.filter(a => a.expiresIn() < 1);
  const deletionPromises = expiredAddrs.map(a => a.destroy());
  await Promise.all(deletionPromises);
  console.log(new Date().toISOString(), `${deletionPromises.length} addresses deleted.`);
}, 1000 * 60 * 5);
