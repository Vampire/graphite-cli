import yargs from 'yargs';
import { graphite } from '../../lib/runner';
import { getBranchDateEnabled } from '../../lib/utils/branch_name';

const args = {
  enable: {
    demandOption: false,
    optional: true,
    type: 'boolean',
    describe: 'Enable date in auto-generated branch names',
  },
  disable: {
    demandOption: false,
    optional: true,
    type: 'boolean',
    describe: 'Disable date in auto-generated branch names',
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'branch-date';
export const canonical = 'user branch-date';
export const description =
  'Toggle prepending date to auto-generated branch names on branch creation.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> => {
  return graphite(argv, canonical, async (context) => {
    if (argv.enable) {
      context.userConfig.update((data) => (data.branchDate = true));
      context.splog.logInfo(`Enabled date`);
    } else if (argv.disable) {
      context.userConfig.update((data) => (data.branchDate = false));
      context.splog.logInfo(`Disabled date`);
    } else {
      context.splog.logInfo(
        `Branch date is ${
          getBranchDateEnabled(context) ? 'enabled' : 'disabled'
        }`
      );
    }
  });
};
