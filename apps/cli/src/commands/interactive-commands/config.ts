import yargs from 'yargs';
import { graphite } from '../../lib/runner';

const args = {
  config: {
    demandOption: true,
    type: 'string',
    positional: true,
    describe: 'The config to load.',
  },
} as const;

export const command = 'config [config]';
export const canonical = 'interactive config';
export const description = false;
export const builder = args;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;
export const handler = async (argv: argsT): Promise<void> => {
  return graphite(argv, canonical, async (context) => {
    void context;

    throw new Error('Unimplemented');
  });
};
