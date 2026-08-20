import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, "../../.env") });

const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID_GROUP;
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID_GROUP;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET_GROUP;
const USER_EMAIL = process.env.USER_EMAIL_GROUP;

if (!AZURE_CLIENT_ID) throw new Error("Missing: AZURE_CLIENT_ID_GROUP");
if (!AZURE_TENANT_ID) throw new Error("Missing: AZURE_TENANT_ID_GROUP");
if (!AZURE_CLIENT_SECRET) throw new Error("Missing: AZURE_CLIENT_SECRET_GROUP");

const SCOPES = ["https://graph.microsoft.com/.default"];

const credential = new ClientSecretCredential(
  AZURE_TENANT_ID,
  AZURE_CLIENT_ID,
  AZURE_CLIENT_SECRET
);

export function getGraphClient(): Client {
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken(SCOPES);
        return token.token;
      }
    }
  });
}

export function getUserEmail(): string {
  return USER_EMAIL || "";
}
