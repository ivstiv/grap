import { simpleParser } from "mailparser";
import { SMTPServer } from "smtp-server";

export const smtpServer = new SMTPServer({
  onData (stream, session, callback) {
    stream.on("end", callback);
    simpleParser(stream, {}, (err, parsed) => {
      if (err) {
        console.log("Error:", err);
      }
      console.log(parsed);
    });
  },
  disabledCommands: ["AUTH"],
});
