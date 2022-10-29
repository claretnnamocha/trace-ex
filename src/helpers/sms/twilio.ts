import fetch from "node-fetch";
import { generateReciepient } from ".";
import { sms } from "../types";

export const send = async ({
  to: To,
  body: Body,
  from: From = null,
}: sms.send) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SENDER_ID } =
    process.env;

  try {
    const phone = generateReciepient(To);

    const details = { From: From || TWILIO_SENDER_ID, Body, To: phone };

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
      "https://api.twilio.com/2010-04-01/Accounts/" +
        `${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "post",
        body,
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
          authorization: `Basic ${Buffer.from(
            `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
          ).toString("base64")}`,
        },
      }
    );

    const data: any = await response.json();

    return data.sid != null;
  } catch (error) {
    return false;
  }
};
