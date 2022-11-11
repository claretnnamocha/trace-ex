import { v4 as uuid } from "uuid";
import { jobs, mail } from "../helpers";
import { EmailQueue } from "./queues";

// export const sendEmail = async ({ to, text, subject, html }) => {
//   const queueName = `sendEmail${uuid()}`;

//   await jobs.bulljs.process({
//     queueName,
//     queue: EmailQueue,
//     callback: async () => {
//       const sent = await mail.pepipost.send({
//         to,
//         text,
//         subject,
//         html,
//       });
//       if (!sent) throw new Error("Email not sent");
//     },
//   });

//   await jobs.bulljs.add({
//     queue: EmailQueue,
//     options: {
//       attempts: 10,
//       backoff: 30 * 1000,
//     },
//     queueName,
//     data: null,
//   });
// };

export const sendEmail = async ({ to, text, subject, html }) => {
  const queueName = `sendEmail${uuid()}`;

  jobs.agenda.process({
    queueName,
    queue: EmailQueue,
    callback: async () => {
      const sent = await mail.pepipost.send({
        to,
        text,
        subject,
        html,
      });
      if (!sent) throw new Error("Email not sent");
    },
  });

  await jobs.agenda.add({
    queue: EmailQueue,
    queueName,
    data: null,
  });

  await EmailQueue.start();
};
