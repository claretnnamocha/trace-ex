import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Express } from "express";

import * as queues from "../jobs/queues";

const serverAdapter = new ExpressAdapter();

createBullBoard({
  queues: Object.values(queues).map((q: any) => new BullAdapter(q)),
  serverAdapter,
});

serverAdapter.setBasePath("/bull-board");

const adapter = serverAdapter;

export const setup = (app: Express) =>
  app.use("/bull-board", adapter.getRouter());
