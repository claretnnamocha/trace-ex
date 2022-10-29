import fetch from "node-fetch";
import { generateReciepient } from ".";
import { sms } from "../types";

export const send = async ({ to, body: message }: sms.send) => {
  const {
    AFRICASTALKING_APIKEY: apiKey,
    AFRICASTALKING_USERNAME: username,
    AFRICASTALKING_SENDER_ID,
    AFRICASTALKING_SANDBOX,
  } = process.env;

  const from = AFRICASTALKING_SANDBOX ? null : AFRICASTALKING_SENDER_ID;

  try {
    const phone = generateReciepient(to);
    const details = {
      username,
      message,
      from,
      to: phone,
    };

    let body: string | Array<string> = [];
    for (let index = 0; index < Object.keys(details).length; index += 1) {
      const key = Object.keys(details)[index];
      const property = details[key];
      if (details[property]) {
        const encodedKey = encodeURIComponent(property);
        const encodedValue = encodeURIComponent(details[property]);
        body.push(`${encodedKey}=${encodedValue}`);
      }
    }
    body = body.join("&");

    const response = await fetch(
      AFRICASTALKING_SANDBOX
        ? "https://api.sandbox.africastalking.com/version1/messaging"
        : "https://api.africastalking.com/version1/messaging",
      {
        method: "post",
        body,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          accept: "application/json",
          apiKey,
        },
      }
    );

    return response.status === 201;
  } catch (error) {
    return false;
  }
};
