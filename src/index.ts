import cors from "cors";
import { config } from "dotenv";
import express, { Request, Response } from "express";
import formdata from "express-form-data";
import swaggerUi from "swagger-ui-express";
import { displayName } from "../package.json";
import { agendaDash, db, env, security, swagger, swaggerDev } from "./configs";
import { debug, isTestnet } from "./configs/env";
import { response } from "./helpers";
import {
  drainActiveWalletAddresses,
  listenForOnChainTransactions,
} from "./jobs";
import { ListeningQueue } from "./jobs/queues";
import routes from "./routes";

config();

const app = express();
const { port, clearDb } = env;

app.use(formdata.parse());
app.use(express.json({ limit: "100mb", type: "application/json" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cors());

app.use("/api-docs", swaggerUi.serve, (_: Request, res: Response) =>
  res.send(swaggerUi.generateHTML(swagger.config))
);
app.use("/api/documentation", swaggerUi.serve, (_: Request, res: Response) =>
  res.send(swaggerUi.generateHTML(swaggerDev.config))
);

agendaDash.setup(app);

security.lock(app);

app.use("", routes);
app.use((error: Error, _: Request, res: Response) =>
  response(
    res,
    { status: false, message: "Internal server error", error },
    500,
    debug
  )
);

if (require.main) {
  app.listen(port, async () => {
    await db.authenticate({ clear: clearDb });
    console.log(
      `${displayName} is running on http://localhost:${port} (${env.env}) (${
        isTestnet ? "testnet" : "mainnet"
      })`
    );

    setTimeout(async () => {
      await ListeningQueue.purge();
      listenForOnChainTransactions();
      drainActiveWalletAddresses();
    }, 5000);
  });
}

export default app;
