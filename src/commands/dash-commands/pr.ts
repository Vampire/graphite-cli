import open from 'open';
import yargs from 'yargs';
import { profile } from '../../lib/telemetry/profile';

const args = {
  pr: {
    describe: `An PR number or branch name to open.`,
    demandOption: false,
    positional: true,
    type: 'string',
  },
} as const;

export const command = 'pr [pr]';
export const description = 'Opens the PR page for the current branch.';
export const builder = args;
export const canonical = 'dash pr';

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

const DASHBOARD_URL = 'https://app.graphite.dev/';
const PR_PATH = DASHBOARD_URL + 'github/pr/';

export const handler = async (argv: argsT): Promise<void> =>
  profile(argv, canonical, async (context) => {
    const prNumber = parseInt(argv.pr || '');
    if (prNumber) {
      return void open(
        `${PR_PATH}${context.repoConfig.getRepoOwner()}/${context.repoConfig.getRepoName()}/${prNumber}`
      );
    }

    const branchName = argv.pr ? argv.pr : context.metaCache.currentBranch;

    const branchPrNumber =
      branchName && context.metaCache.branchExists(branchName)
        ? context.metaCache.getPrInfo(branchName)?.number
        : undefined;

    if (branchPrNumber) {
      return void open(
        `${PR_PATH}${context.repoConfig.getRepoOwner()}/${context.repoConfig.getRepoName()}/${branchPrNumber}`
      );
    }

    return void open(DASHBOARD_URL);
  });
