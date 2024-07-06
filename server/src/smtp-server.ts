import type { AddressObject } from "mailparser";
import { simpleParser } from "mailparser";
import { SMTPServer } from "smtp-server";
import { EmailAddress } from "./models/EmailAddress";

export const smtpServer = new SMTPServer({
  onData (stream, session, callback) {
    stream.on("error", err => {
      console.log("SMTP Error", err);
    });
    stream.on("end", callback);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    simpleParser(stream, {}, async (err, parsed) => {
      if (err) {
        console.log("Error:", err);
      }

      const addressObj = parsed.headers.get("to");
      if(isAddressObject(addressObj)) {
        const destinationAddr = addressObj.value[0]?.address;

        if (!destinationAddr) {
          return console.log("Couldn't parse destination address.");
        }

        const address = await EmailAddress.query().where({
          address: destinationAddr,
        }).first();

        if (!address) {
          return console.log(`Missing address for recipient: ${destinationAddr}`);
        }

        const parsedSubject = parsed.headers.get("subject") as string;
        const parsedFrom = parsed.headers.get("from") as AddressObject;
        await address.insertEmail({
          subject: parsedSubject,
          from: parsedFrom.text,
          content: parsed.html
            || parsed.text
            || parsed.textAsHtml,
        });
      }
    });
  },
  disabledCommands: ["AUTH"],
});


// TO-DO: there must be a better way to do this
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isAddressObject = (x: any): x is AddressObject =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  Object.hasOwn(x, "value") && x.value.length > 0 && !!x.value[0].address;
