import { Job, JobAttributesData } from "agenda";
import crypto from "crypto";
import fetch from "node-fetch";
import { v4 as uuid } from "uuid";
import { jobs } from "../helpers";
import { App } from "../models";
import { AppSchema } from "../types/models";
import { WebhookQueue } from "./queues";

export const sendWebhook = async ({ appId, body }) => {
  console.log("Sending webhook 🕸️🪝");
  const queueName = `sendWebhook-${uuid()}`;
  const queue = WebhookQueue;

  jobs.agenda.process({
    queueName,
    queue,
    callback: async () => {
      const { webhookUrl, secretKey }: AppSchema = await App.findByPk(appId);
      console.log(body, secretKey, webhookUrl);

      const signature = crypto
        .createHmac("sha512", secretKey)
        .update(JSON.stringify(body))
        .digest("hex");

      await fetch(webhookUrl, {
        method: "post",
        body: JSON.stringify(body),
        headers: {
          "x-keeway-signature": signature,
          "content-type": "application/json",
        },
      });
    },
  });

  await jobs.agenda.add({
    queue,
    queueName,
    data: { maxRetries: 73 },
  });

  queue.on(`fail:${queueName}`, async (_, job: Job<JobAttributesData>) => {
    if (job.attrs.data.maxRetries >= job.attrs.failCount) {
      job.repeatEvery("1 hour");
      await job.save();
    }
  });

  await queue.start();
};
