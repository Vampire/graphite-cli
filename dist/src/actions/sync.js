"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAction = void 0;
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const prompts_1 = __importDefault(require("prompts"));
const config_1 = require("../lib/config");
const errors_1 = require("../lib/errors");
const preconditions_1 = require("../lib/preconditions");
const utils_1 = require("../lib/utils");
const splog_1 = require("../lib/utils/splog");
const branch_1 = __importDefault(require("../wrapper-classes/branch"));
const metadata_ref_1 = __importDefault(require("../wrapper-classes/metadata_ref"));
const onto_1 = require("./onto");
const submit_1 = require("./submit");
function syncAction(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        if (utils_1.uncommittedChanges()) {
            throw new errors_1.PreconditionsFailedError("Cannot sync with uncommitted changes");
        }
        const oldBranch = preconditions_1.currentBranchPrecondition();
        const trunk = utils_1.getTrunk().name;
        utils_1.checkoutBranch(trunk);
        if (opts.pull) {
            utils_1.gpExecSync({ command: `git pull` }, (err) => {
                utils_1.checkoutBranch(oldBranch.name);
                throw new errors_1.ExitFailedError(`Failed to pull trunk ${trunk}`, err);
            });
        }
        yield deleteMergedBranches(opts.force);
        if (branch_1.default.exists(oldBranch.name)) {
            utils_1.checkoutBranch(oldBranch.name);
        }
        else {
            utils_1.checkoutBranch(trunk);
        }
        yield resubmitBranchesWithNewBases(opts.force);
        cleanDanglingMetadata();
    });
}
exports.syncAction = syncAction;
function deleteMergedBranches(force) {
    return __awaiter(this, void 0, void 0, function* () {
        const trunkChildren = utils_1.getTrunk().getChildrenFromMeta();
        do {
            const branch = trunkChildren.pop();
            if (!branch) {
                break;
            }
            const children = branch.getChildrenFromMeta();
            if (!shouldDeleteBranch(branch.name)) {
                continue;
            }
            for (const child of children) {
                utils_1.checkoutBranch(child.name);
                utils_1.logInfo(`upstacking (${child.name}) onto (${utils_1.getTrunk().name})`);
                yield onto_1.ontoAction(utils_1.getTrunk().name);
                trunkChildren.push(child);
            }
            utils_1.checkoutBranch(utils_1.getTrunk().name);
            yield deleteBranch({ branchName: branch.name, force });
        } while (trunkChildren.length > 0);
    });
}
function shouldDeleteBranch(branchName) {
    const trunk = utils_1.getTrunk().name;
    const cherryCheckProvesMerged = child_process_1.execSync(`mergeBase=$(git merge-base ${trunk} ${branchName}) && git cherry ${trunk} $(git commit-tree $(git rev-parse "${branchName}^{tree}") -p $mergeBase -m _)`)
        .toString()
        .trim()
        .startsWith("-");
    if (cherryCheckProvesMerged) {
        return true;
    }
    const diffCheckProvesMerged = child_process_1.execSync(`git diff ${branchName} ${trunk} | wc -l`).toString().trim() ===
        "0";
    if (diffCheckProvesMerged) {
        return true;
    }
    return false;
}
function deleteBranch(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!opts.force) {
            const response = yield prompts_1.default({
                type: "confirm",
                name: "value",
                message: `Delete (${chalk_1.default.green(opts.branchName)}), which has been merged into (${utils_1.getTrunk().name})?`,
                initial: true,
            }, {
                onCancel: () => {
                    throw new errors_1.KilledError();
                },
            });
            if (response.value != true) {
                return;
            }
        }
        utils_1.logInfo(`Deleting (${chalk_1.default.red(opts.branchName)})`);
        child_process_1.execSync(`git branch -D ${opts.branchName}`);
    });
}
function cleanDanglingMetadata() {
    const allMetadataRefs = metadata_ref_1.default.allMetadataRefs();
    const allBranches = branch_1.default.allBranches();
    allMetadataRefs.forEach((ref) => {
        if (!allBranches.find((b) => b.name === ref._branchName)) {
            splog_1.logDebug(`Deleting metadata for ${ref._branchName}`);
            ref.delete();
        }
    });
}
function resubmitBranchesWithNewBases(force) {
    return __awaiter(this, void 0, void 0, function* () {
        const needsResubmission = [];
        branch_1.default.allBranches().forEach((b) => {
            var _a, _b;
            const base = (_a = b.getPRInfo()) === null || _a === void 0 ? void 0 : _a.base;
            if (base && base !== ((_b = b.getParentFromMeta()) === null || _b === void 0 ? void 0 : _b.name)) {
                needsResubmission.push(b);
            }
        });
        if (needsResubmission.length === 0) {
            return;
        }
        utils_1.logInfo([
            `Detected merge bases changes for:`,
            ...needsResubmission.map((b) => `- ${b.name}`),
        ].join("\n"));
        // Prompt for resubmission.
        let resubmit = force;
        if (!force) {
            const response = yield prompts_1.default({
                type: "confirm",
                name: "value",
                message: `Update remote PR mergebases to match local?`,
                initial: true,
            });
            resubmit = response.value;
        }
        if (resubmit) {
            utils_1.logInfo(`Updating outstanding PR mergebases...`);
            const cliAuthToken = preconditions_1.cliAuthPrecondition();
            const repoName = config_1.repoConfig.getRepoName();
            const repoOwner = config_1.repoConfig.getRepoOwner();
            const submittedPRInfo = yield submit_1.submitPRsForBranches({
                branches: needsResubmission,
                branchesPushedToRemote: needsResubmission,
                cliAuthToken: cliAuthToken,
                repoOwner: repoOwner,
                repoName: repoName,
                editPRFieldsInline: false,
                createNewPRsAsDraft: false,
            });
            submit_1.saveBranchPRInfo(submittedPRInfo);
        }
    });
}
//# sourceMappingURL=sync.js.map