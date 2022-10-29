import fs from "fs";
import swaggerJsDoc, { Options } from "swagger-jsdoc";
import { displayName, version, author } from "../../package.json";
import { env, isTestnet, port } from "./env";

const description = () => fs.readFileSync("src/docs/description.md").toString();

const apis = ["./src/docs/**/*.yml"];
if (env === "development") apis.push("./src/docs/**/*.yaml");

const swagger: Options = {
  swaggerDefinition: {
    info: {
      version,
      description: description(),
      title: `${displayName} (${env}) (${isTestnet ? "testnet" : "mainnet"})`,
      contact: { name: author?.name, email: author?.email },
      servers: [{ url: `http://localhost:${port}` }],
    },
  },
  apis,
};

const config = swaggerJsDoc(swagger);

export { config };
