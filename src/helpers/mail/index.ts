export * as mailgun from "./mailgun";
export * as pepipost from "./pepipost";
export * as sendgrid from "./sendgrid";

export const generateReciepient = (to: string | string[]) => {
  let reciepients: any;

  if (typeof to === "string") {
    reciepients = [{ email: to }];
  } else {
    reciepients = to.map((email) => ({ email }));
  }
  return reciepients;
};
export const generateReciepient2 = (to: string | string[]) => {
  if (typeof to === "string") return to;

  return to.join(",");
};

export const generateReciepient3 = (to: string | string[]) => {
  let reciepients: any;

  if (typeof to === "string") {
    reciepients = [to];
    return reciepients;
  }
  return to;
};
