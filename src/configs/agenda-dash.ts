import Agenda from "agenda";
import Agendash from "agendash";
import { Express } from "express";

export const setup = (app: Express) => {
  const { AGENDA_DB_URL } = process.env;
  const agenda = new Agenda({ db: { address: AGENDA_DB_URL } });
  return app.use("/agenda-dash", Agendash(agenda));
};
