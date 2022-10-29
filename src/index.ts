import cors from "cors";
import express, { Request, Response } from "express";
import formdata from "express-form-data";
import swaggerUi from "swagger-ui-express";
import { displayName } from "../package.json";
import { bullBoard, db, env, security, swagger, swaggerDev } from "./configs";
import { debug, isTestnet } from "./configs/env";
import { response } from "./helpers";
import { listenForOnChainTransactions } from "./jobs/listenForOnChainTransactions";
import routes from "./routes";

const app = express();
const { port, clearDb } = env;
db.authenticate({ clear: clearDb });

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

app.use("/bull-board", bullBoard.adapter.getRouter());

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
  app.listen(port, () => {
    console.log(
      `${displayName} is running on http://localhost:${port} (${env.env}) (${
        isTestnet ? "testnet" : "mainnet"
      })`
    );

    listenForOnChainTransactions();
  });
}

export default app;
