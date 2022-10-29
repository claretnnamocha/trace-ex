import swaggerJsDoc, { Options } from "swagger-jsdoc";
import { displayName, version } from "../../package.json";
import { isTestnet, port } from "./env";

const apis = ["./src/docs/dev/*.yml"];

const swagger: Options = {
  swaggerDefinition: {
    info: {
      version,
      title: `${displayName} API Reference (${
        isTestnet ? "testnet" : "mainnet"
      })`,
      contact: { name: "Keeway Developers", email: "devlopers@trace.exchange" },
      servers: [{ url: `http://localhost:${port}` }],
    },
  },
  apis,
};

const config = swaggerJsDoc(swagger);

export { config };
