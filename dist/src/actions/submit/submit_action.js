"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitAction = void 0;
const chalk_1 = __importDefault(require("chalk"));
const prompts_1 = __importDefault(require("prompts"));
const errors_1 = require("../../lib/errors");
const runner_1 = require("../../lib/git/runner");
const preconditions_1 = require("../../lib/preconditions");
const survey_1 = require("../survey");
const prepare_branches_1 = require("./prepare_branches");
const submit_prs_1 = require("./submit_prs");
const validate_branches_1 = require("./validate_branches");
// eslint-disable-next-line max-lines-per-function
async function submitAction(args, context) {
    // Check CLI pre-condition to warn early
    if (args.draft && args.publish) {
        throw new errors_1.ExitFailedError(`Can't use both --publish and --draft flags in one command`);
    }
    const populateRemoteShasPromise = context.metaCache.populateRemoteShas();
    const cliAuthToken = (0, preconditions_1.cliAuthPrecondition)(context);
    if (args.dryRun) {
        context.splog.info(chalk_1.default.yellow(`Running submit in 'dry-run' mode. No branches will be pushed and no PRs will be opened or updated.`));
        context.splog.newline();
        args.editPRFieldsInline = false;
    }
    if (!context.interactive) {
        args.editPRFieldsInline = false;
        args.reviewers = undefined;
        context.splog.info(`Running in non-interactive mode. Inline prompts to fill PR fields will be skipped${!(args.draft || args.publish)
            ? ' and new PRs will be created in draft mode'
            : ''}.`);
        context.splog.newline();
    }
    const allBranchNames = context.metaCache
        .getRelativeStack(context.metaCache.currentBranchPrecondition, args.scope)
        .filter((branchName) => !context.metaCache.isTrunk(branchName));
    const branchNames = args.select
        ? await selectBranches(allBranchNames)
        : allBranchNames;
    context.splog.info(chalk_1.default.blueBright(`🥞 Validating that this Graphite stack is ready to submit...`));
    context.splog.newline();
    await (0, validate_branches_1.validateBranchesToSubmit)(branchNames, context);
    context.splog.info(chalk_1.default.blueBright('✏️  Preparing to submit PRs for the following branches...'));
    await populateRemoteShasPromise;
    const submissionInfos = await (0, prepare_branches_1.getPRInfoForBranches)({
        branchNames: branchNames,
        editPRFieldsInline: args.editPRFieldsInline && context.interactive,
        draft: args.draft,
        publish: args.publish,
        updateOnly: args.updateOnly,
        reviewers: args.reviewers,
        dryRun: args.dryRun,
        select: args.select,
    }, context);
    if (await shouldAbort({ ...args, hasAnyPrs: submissionInfos.length > 0 }, context)) {
        return;
    }
    context.splog.info(chalk_1.default.blueBright('📨 Pushing to remote and creating/updating PRs...'));
    for (const submissionInfo of submissionInfos) {
        try {
            context.metaCache.pushBranch(submissionInfo.head, args.forcePush);
        }
        catch (err) {
            if (err instanceof runner_1.CommandFailedError &&
                err.message.includes('stale info')) {
                throw new errors_1.ExitFailedError([
                    `Force-with-lease push of ${chalk_1.default.yellow(submissionInfo.head)} failed due to external changes to the remote branch.`,
                    'If you are collaborating on this stack, try `gt downstack get` to pull in changes.',
                    'Alternatively, use the `--force` option of this command to bypass the stale info warning.',
                ].join('\n'));
            }
            throw err;
        }
        await (0, submit_prs_1.submitPullRequest)({ submissionInfo: [submissionInfo], cliAuthToken }, context);
    }
    if (!context.interactive) {
        return;
    }
    const survey = await (0, survey_1.getSurvey)(context);
    if (survey) {
        await (0, survey_1.showSurvey)(survey, context);
    }
}
exports.submitAction = submitAction;
async function selectBranches(branchNames) {
    const result = [];
    for (const branchName of branchNames) {
        const selected = (await (0, prompts_1.default)({
            name: 'value',
            initial: true,
            type: 'confirm',
            message: `Would you like to submit ${chalk_1.default.cyan(branchName)}?`,
        })).value;
        // Clear the prompt result
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(1);
        if (selected) {
            result.push(branchName);
        }
    }
    return result;
}
async function shouldAbort(args, context) {
    if (args.dryRun) {
        context.splog.info(chalk_1.default.blueBright('✅ Dry run complete.'));
        return true;
    }
    if (!args.hasAnyPrs) {
        context.splog.info(chalk_1.default.blueBright('🆗 All PRs up to date.'));
        return true;
    }
    if (context.interactive &&
        args.confirm &&
        !(await (0, prompts_1.default)({
            type: 'confirm',
            name: 'value',
            message: 'Continue with this submit operation?',
            initial: true,
        }, {
            onCancel: () => {
                throw new errors_1.KilledError();
            },
        })).value) {
        context.splog.info(chalk_1.default.blueBright('🛑 Aborted submit.'));
        throw new errors_1.KilledError();
    }
    return false;
}
//# sourceMappingURL=submit_action.js.map