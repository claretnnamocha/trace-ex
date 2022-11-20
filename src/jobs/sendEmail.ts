import { Job, JobAttributesData } from "agenda";
import { v4 as uuid } from "uuid";
import { jobs, mail } from "../helpers";
import { EmailQueue } from "./queues";

export const sendEmail = async ({ to, text, subject, html }) => {
  const queueName = `sendEmail-${uuid()}`;
  const queue = EmailQueue;

  jobs.agenda.process({
    queueName,
    queue,
    callback: async () => {
      console.log("Sending email 📧");

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
    queue,
    queueName,
    data: { maxRetries: 3 },
  });

  queue.on(`fail:${queueName}`, async (_, job: Job<JobAttributesData>) => {
    if (job.attrs.data.maxRetries >= job.attrs.failCount) {
      job.repeatEvery("30 seconds");
      await job.save();
    }
  });

  await queue.start();
};
