import prompts from 'prompts';
import { TContext } from '../../lib/context';
import { KilledError } from '../../lib/errors';

export async function getPRTitle(
  args: {
    branchName: string;
    editPRFieldsInline?: boolean;
  },
  context: TContext
): Promise<string> {
  // First check if we have a saved title;
  // otherwise, use the subject of the oldest commit on the branch.
  const title =
    context.engine.getPrInfo(args.branchName)?.title ??
    context.engine.getAllCommits(args.branchName, 'SUBJECT').reverse()[0];

  if (args.editPRFieldsInline === false) {
    return title;
  }

  const response = await prompts(
    {
      type: 'text',
      name: 'title',
      message: 'Title',
      initial: title,
    },
    {
      onCancel: () => {
        throw new KilledError();
      },
    }
  );
  return response.title ?? title;
}
