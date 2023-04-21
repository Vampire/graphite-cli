"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphiteWithoutRepo = exports.graphite = void 0;
const chalk_1 = __importDefault(require("chalk"));
const package_json_1 = require("../../package.json");
const init_1 = require("../actions/init");
const fetch_pr_info_1 = require("../background_tasks/fetch_pr_info");
const post_survey_1 = require("../background_tasks/post_survey");
const post_traces_1 = require("../background_tasks/post_traces");
const upgrade_prompt_1 = require("../background_tasks/upgrade_prompt");
const context_1 = require("./context");
const cache_lock_1 = require("./engine/cache_lock");
const errors_1 = require("./errors");
const git_1 = require("./git/git");
const tracer_1 = require("./utils/tracer");
const runner_1 = require("./git/runner");
async function graphite(args, canonicalName, handler) {
    return graphiteInternal(args, canonicalName, {
        repo: true,
        run: handler,
    });
}
exports.graphite = graphite;
async function graphiteWithoutRepo(args, canonicalName, handler) {
    return graphiteInternal(args, canonicalName, {
        repo: false,
        run: handler,
    });
}
exports.graphiteWithoutRepo = graphiteWithoutRepo;
async function graphiteInternal(args, canonicalName, handler) {
    const handlerMaybeWithCacheLock = handler.repo
        ? {
            ...handler,
            cacheLock: (0, cache_lock_1.getCacheLock)(),
        }
        : { ...handler, cacheLock: undefined };
    process.on('SIGINT', () => {
        handlerMaybeWithCacheLock.cacheLock?.release();
        // End all current traces abruptly.
        tracer_1.tracer.allSpans.forEach((s) => s.end(undefined, new errors_1.KilledError()));
        (0, post_traces_1.postTelemetryInBackground)();
        // eslint-disable-next-line no-restricted-syntax
        process.exit(1);
    });
    const git = (0, git_1.composeGit)();
    const contextLite = (0, context_1.initContextLite)({
        ...args,
        userEmail: git.getUserEmail(),
    });
    try {
        await tracer_1.tracer.span({
            name: 'command',
            resource: canonicalName,
            meta: {
                user: contextLite.userEmail ?? 'NotFound',
                version: package_json_1.version,
                processArgv: process.argv.join(' '),
            },
        }, async () => {
            (0, upgrade_prompt_1.fetchUpgradePromptInBackground)(contextLite);
            (0, post_survey_1.postSurveyResponsesInBackground)(contextLite);
            if (!handlerMaybeWithCacheLock.repo) {
                await handlerMaybeWithCacheLock.run(contextLite);
                return;
            }
            const context = (0, context_1.initContext)(contextLite, git, args);
            return await graphiteHelper(canonicalName, handlerMaybeWithCacheLock, context);
        });
    }
    catch (err) {
        handleGraphiteError(err, contextLite);
        contextLite.splog.debug(err.stack);
        // print errors when debugging tests
        if (process.env.DEBUG) {
            process.stdout.write(err.stack.toString());
        }
        process.exitCode = 1;
    }
    (0, post_traces_1.postTelemetryInBackground)();
}
// eslint-disable-next-line max-params
async function graphiteHelper(canonicalName, handler, context) {
    const cacheBefore = context.engine.debug;
    try {
        (0, fetch_pr_info_1.refreshPRInfoInBackground)(context);
        if (canonicalName !== 'repo init' &&
            !context.repoConfig.graphiteInitialized()) {
            context.splog.info(`Graphite has not been initialized, attempting to setup now...`);
            context.splog.newline();
            await (0, init_1.init)({}, context);
        }
        await handler.run(context);
    }
    catch (err) {
        if (err.constructor === errors_1.DetachedError &&
            context.engine.rebaseInProgress()) {
            throw new errors_1.DetachedError(`Did you mean to run ${chalk_1.default.cyan(`gt continue`)}?`);
        }
        throw err;
    }
    finally {
        try {
            context.engine.persist();
        }
        catch (persistError) {
            context.engine.clear();
            context.splog.debug(`Failed to persist Graphite cache`);
        }
        handler.cacheLock.release();
    }
    return { cacheBefore, cacheAfter: context.engine.debug };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleGraphiteError(err, context) {
    switch (err.constructor) {
        case runner_1.CommandKilledError:
        case errors_1.KilledError: // the user doesn't need a message if they ended gt
        case errors_1.RebaseConflictError: // we've already logged a message
            // pass
            return;
        case errors_1.UntrackedBranchError:
        case errors_1.BadTrunkOperationError:
        case errors_1.ExitFailedError:
        case errors_1.ConcurrentExecutionError:
        case errors_1.PreconditionsFailedError:
        case runner_1.CommandFailedError:
        default:
            context.splog.error(err.message);
            return;
    }
}
//# sourceMappingURL=runner.js.map