import { execSync } from "child_process";
import yargs from "yargs";
import { profile } from "../lib/telemetry";

const args = {} as const;

export const command = "log";
export const description = "Log all stacks";
export const builder = args;
export const aliases = ["l"];

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;
export const handler = async (argv: argsT): Promise<void> => {
  return profile(argv, async () => {
    try {
      execSync(
        `git log --graph --abbrev-commit --decorate --format=format:'%C(bold blue)%h%C(reset) - %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset) %C(dim white)- %an%C(reset)%C(auto)%d%C(reset)' --all`,
        { stdio: "inherit" }
      );
    } catch (e) {
      // Ignore errors (this just means they quit git log)
    }
  });
};
