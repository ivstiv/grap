import { simpleParser, AddressObject } from "mailparser";
import { SMTPServer } from "smtp-server";
import { eventBus } from "./EventBus";
import { Email } from "./models/Email";
import { EmailAddress } from "./models/EmailAddress";

export const smtpServer = new SMTPServer({
  onData (stream, session, callback) {
    stream.on("error", err => {
      console.log("SMTP Error", err);
    });
    stream.on("end", callback);

    simpleParser(stream, {}, async (err, parsed) => {
      if (err) {
        console.log("Error:", err);
      }

      const addressObj = parsed.headers.get("to");
      if(isAddressObject(addressObj)) {
        const destinationAddr = addressObj.value[0].address;
        const address = await EmailAddress.query().where({
          address: destinationAddr,
        }).first();

        if (!address) {
          return console.log(`Missing address for recipient: ${destinationAddr}`);
        }

        const parsedSubject = parsed.headers.get("subject") as string;
        const parsedFrom = parsed.headers.get("from") as AddressObject;
        const email = await Email.query().insertAndFetch({
          address: address.id,
          subject: parsedSubject ?? "Missing subject",
          from: parsedFrom.text ?? "Mising sender",
          content: parsed.html
            || parsed.text
            || parsed.textAsHtml
            || "Couldn't parse the email contents. Open a github issue and let me know who the sender of the email was, so I can test and amend the parsing.",
        });
        eventBus.emit({
          type: "ParsedEmail",
          detail: {
            email,
          },
        });
      }
    });
  },
  disabledCommands: ["AUTH"],
});


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isAddressObject = (x: any): x is AddressObject => 
  Object.hasOwn(x, "value")
    && x.value.length > 0
    && !!x.value[0].address;
