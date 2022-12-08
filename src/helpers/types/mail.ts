export interface send {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface UpsertContact {
  email: string;
  [key: string]: any;
}
