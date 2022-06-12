import { CronJob } from "cron";
import { Model } from "objection";
import { db } from "./database/database";
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


new CronJob(
  "0 */5 * * * *",
  () => {
    console.log(new Date(), "Address cleanup job running...");
  },
  null,
  true,
);
