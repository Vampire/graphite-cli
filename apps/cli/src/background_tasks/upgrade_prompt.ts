import { API_ROUTES } from '@withgraphite/graphite-cli-routes';
import { request } from '@withgraphite/retyped-routes';
import { version } from '../../package.json';
import { TContextLite } from '../lib/context';
import { composeGit } from '../lib/git/git';
import {
  messageConfigFactory,
  TMessageConfig,
} from '../lib/spiffy/upgrade_message_spf';
import { userConfigFactory } from '../lib/spiffy/user_config_spf';
import { spawnDetached } from '../lib/utils/spawn';

function printAndClearOldMessage(context: TContextLite): void {
  const oldMessage = context.messageConfig.data.message;
  // "Since we fetch the message asynchronously and display it when the user runs their next Graphite command,
  // double-check before showing the message if the CLI is still an old version
  // (i.e. the user hasn't updated the CLI in the meantime)."
  if (oldMessage && version == oldMessage.cliVersion) {
    context.splog.message(oldMessage.contents);
    context.messageConfig.update((data) => (data.message = undefined));
  }
}
export function fetchUpgradePromptInBackground(context: TContextLite): void {
  printAndClearOldMessage(context);
  spawnDetached(__filename);
}

async function fetchUpgradePrompt(
  messageConfig: TMessageConfig
): Promise<void> {
  const userConfig = userConfigFactory.load();
  if (process.env.GRAPHITE_DISABLE_UPGRADE_PROMPT) {
    return;
  }
  try {
    const user = composeGit().getUserEmail();
    const response = await request.requestWithArgs(
      userConfig.getApiServerUrl(),
      API_ROUTES.upgradePrompt,
      {},
      {
        user: user ?? 'NotFound',
        currentVersion: version,
      }
    );

    if (response._response.status == 200) {
      if (response.prompt) {
        const message = response.prompt.message;
        messageConfig.update(
          (data) =>
            (data.message = {
              contents: message,
              cliVersion: version,
            })
        );
      } else {
        messageConfig.update((data) => (data.message = undefined));
      }
    }
  } catch (err) {
    return;
  }
}

if (process.argv[1] === __filename) {
  void fetchUpgradePrompt(messageConfigFactory.load());
}
