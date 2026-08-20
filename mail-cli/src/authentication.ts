import { DeviceCodeCredential } from "@azure/identity";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config as dotenvConfig } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, "../../.env") });

// Constants
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID_GROUP;
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID_GROUP;
const USER_EMAIL = process.env.USER_EMAIL_GROUP;
const SCOPES = ["User.Read", "Mail.Send"];

if (!AZURE_CLIENT_ID) throw new Error("Missing required environment variable: AZURE_CLIENT_ID_GROUP");
if (!AZURE_TENANT_ID) throw new Error("Missing required environment variable: AZURE_TENANT_ID_GROUP");

// In-memory token cache for GitHub Actions
let cachedToken: string | null = null;

const createCredential = () =>
  new DeviceCodeCredential({
    tenantId: AZURE_TENANT_ID,
    clientId: AZURE_CLIENT_ID,
    userPromptCallback: (info) => {
      console.log("\n--- USER AUTHENTICATION ---");
      console.log(info.message);
      console.log("---------------------------\n");
    },
  });

let credential = createCredential();

export const authProvider = {
  getAccessToken: async () => {
    // Return cached token if valid
    if (cachedToken) {
      return cachedToken;
    }
    
    try {
      const tokenResponse = await credential.getToken(SCOPES);
      if (!tokenResponse) throw new Error("Unable to acquire access token from Azure Identity.");
      cachedToken = tokenResponse.token;
      return tokenResponse.token;
    } catch (error: any) {
      console.error("Authentication failed:", error.message);
      process.exit(1);
    }
  },
  getUserEmail: () => USER_EMAIL
};
