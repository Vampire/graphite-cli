"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userConfigFactory = exports.DEFAULT_GRAPHITE_APP_SERVER = exports.DEFAULT_GRAPHITE_API_SERVER = void 0;
const t = __importStar(require("@withgraphite/retype"));
const child_process_1 = require("child_process");
const git_editor_1 = require("../git/git_editor");
const runner_1 = require("../git/runner");
const spiffy_1 = require("./spiffy");
const schema = t.shape({
    branchPrefix: t.optional(t.string),
    branchDate: t.optional(t.boolean),
    branchReplacement: t.optional(t.unionMany([t.literal('_'), t.literal('-'), t.literal('')])),
    authToken: t.optional(t.string),
    tips: t.optional(t.boolean),
    editor: t.optional(t.string),
    pager: t.optional(t.string),
    restackCommitterDateIsAuthorDate: t.optional(t.boolean),
    submitIncludeCommitMessages: t.optional(t.boolean),
    alternativeProfiles: t.optional(t.array(t.shape({
        name: t.string,
        hostPrefix: t.string,
        authToken: t.optional(t.string),
    }))),
});
exports.DEFAULT_GRAPHITE_API_SERVER = 'https://api.graphite.dev/v1';
exports.DEFAULT_GRAPHITE_APP_SERVER = 'https://app.graphite.dev';
exports.userConfigFactory = (0, spiffy_1.spiffy)({
    schema,
    defaultLocations: [
        {
            relativePath: '.graphite_user_config',
            relativeTo: 'USER_HOME',
        },
    ],
    initialize: () => {
        return {};
    },
    helperFunctions: (data) => {
        // Read the user config and return a host prefix.
        // If none specified, default to empty string.
        const getDefaultProfile = () => {
            const alternativeProfiles = data.alternativeProfiles ?? [];
            if (process.env.GRAPHITE_PROFILE) {
                const alternativeProfile = alternativeProfiles.find((p) => p.name === process.env.GRAPHITE_PROFILE);
                if (alternativeProfile) {
                    return alternativeProfile;
                }
                else {
                    throw new Error(`Unknown profile ${process.env.GRAPHITE_PROFILE}`);
                }
            }
            const optionalDefaultProfile = alternativeProfiles.find((p) => p.name === 'default');
            if (optionalDefaultProfile) {
                return optionalDefaultProfile;
            }
            else {
                return {
                    name: 'default',
                    hostPrefix: '',
                    authToken: data.authToken,
                };
            }
        };
        const getApiServerUrl = () => {
            const hostPrefix = getDefaultProfile().hostPrefix;
            return hostPrefix
                ? `https://api.${hostPrefix}.graphite.dev/v1`
                : exports.DEFAULT_GRAPHITE_API_SERVER;
        };
        const getAppServerUrl = () => {
            const hostPrefix = getDefaultProfile().hostPrefix;
            return hostPrefix
                ? `https://app.${hostPrefix}.graphite.dev`
                : exports.DEFAULT_GRAPHITE_APP_SERVER;
        };
        const getAuthToken = () => {
            return getDefaultProfile().authToken;
        };
        const getEditor = () => {
            return (process.env.GT_EDITOR ?? // single command override
                data.editor ??
                process.env.TEST_GT_EDITOR ?? // for tests
                // If we don't have an editor set, do what git would do
                (0, git_editor_1.getGitEditor)() ??
                process.env.GIT_EDITOR ??
                process.env.EDITOR ??
                'vi');
        };
        const getPager = () => {
            // If we don't have a pager set, do what git would do
            const pager = process.env.GT_PAGER ?? // single command override
                data.pager ??
                process.env.TEST_GT_PAGER ?? // for tests
                // If we don't have a pager set, do what git would do
                (0, git_editor_1.getGitPager)() ??
                process.env.GIT_PAGER ??
                process.env.PAGER ??
                'less';
            return pager === '' ? undefined : pager;
        };
        return {
            getEditor,
            getApiServerUrl,
            getAppServerUrl,
            getAuthToken,
            getPager,
            execEditor: (editFilePath) => {
                const command = `${getEditor()} ${editFilePath}`;
                try {
                    (0, child_process_1.execSync)(command, { stdio: 'inherit', encoding: 'utf-8' });
                }
                catch (e) {
                    throw new runner_1.CommandFailedError({ command, args: [editFilePath], ...e });
                }
            },
        };
    },
});
//# sourceMappingURL=user_config_spf.js.map