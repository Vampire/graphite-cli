import { TEngine } from './engine/engine';
import { TGit } from './git/git';
import { TContinueConfig } from './spiffy/continuation_spf';
import { TRepoConfig } from './spiffy/repo_config_spf';
import { TSurveyConfig } from './spiffy/survey_responses_spf';
import { TMessageConfig } from './spiffy/upgrade_message_spf';
import { TUserConfig } from './spiffy/user_config_spf';
import { TSplog } from './utils/splog';
export declare const USER_CONFIG_OVERRIDE_ENV: "GRAPHITE_USER_CONFIG_PATH";
export declare type TContextLite = {
    splog: TSplog;
    interactive: boolean;
    surveyConfig: TSurveyConfig;
    userConfig: TUserConfig;
    messageConfig: TMessageConfig;
    userEmail?: string;
};
declare type TRepoContext = {
    repoConfig: TRepoConfig;
    continueConfig: TContinueConfig;
    engine: TEngine;
};
export declare function initContextLite(opts?: {
    interactive?: boolean;
    quiet?: boolean;
    debug?: boolean;
    userEmail?: string;
}): TContextLite;
export declare type TContext = TRepoContext & TContextLite;
export declare function initContext(contextLite: TContextLite, git: TGit, opts?: {
    verify?: boolean;
}): TContext;
export {};
