import yargs from "yargs";
import { UserConfig } from "../lib/config";
import { profile } from "../lib/telemetry";
import { logSuccess } from "../lib/utils";

const args = {
  token: {
    type: "string",
    alias: "t",
    describe: "Auth token",
    demandOption: true,
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = "auth";
export const description =
  "Associates an auth token with your Graphite CLI. This token is used to associate your CLI with your account, allowing us to create and update your PRs on GitHub, for example. To obtain your CLI token, visit https://app.graphite.dev/activate.";
export const builder = args;

export const handler = async (argv: argsT): Promise<void> => {
  return profile(argv, async () => {
    UserConfig.setUserAuthToken(argv.token);
    logSuccess("🔐 Successfully authenticated!");
  });
};
