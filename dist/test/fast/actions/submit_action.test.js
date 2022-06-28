"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const pr_body_1 = require("../../../src/actions/submit/pr_body");
const pr_title_1 = require("../../../src/actions/submit/pr_title");
const validate_branches_1 = require("../../../src/actions/submit/validate_branches");
const basic_scene_1 = require("../../lib/scenes/basic_scene");
const configure_test_1 = require("../../lib/utils/configure_test");
(0, chai_1.use)(chai_as_promised_1.default);
for (const scene of [new basic_scene_1.BasicScene()]) {
    describe(`(${scene}): correctly infers submit info from commits`, function () {
        (0, configure_test_1.configureTest)(this, scene);
        it('can infer title/body from single commit', () => {
            const title = 'Test Title';
            const body = ['Test body line 1.', 'Test body line 2.'].join('\n');
            const message = `${title}\n\n${body}`;
            scene.repo.execCliCommand(`branch create "a" -m "${message}" -q`);
            (0, chai_1.expect)((0, pr_title_1.inferPRTitle)('a', scene.getContext())).to.equals(title);
            (0, chai_1.expect)((0, pr_body_1.inferPRBody)('a', scene.getContext())).to.equals(body);
        });
        it('can infer just title with no body', () => {
            const title = 'Test Title';
            const commitMessage = title;
            scene.repo.createChange('a');
            scene.repo.execCliCommand(`branch create "a" -m "${commitMessage}" -q`);
            (0, chai_1.expect)((0, pr_title_1.inferPRTitle)('a', scene.getContext())).to.equals(title);
            (0, chai_1.expect)((0, pr_body_1.inferPRBody)('a', scene.getContext())).to.be.undefined;
        });
        it('does not infer title/body for multiple commits', async () => {
            const title = 'Test Title';
            const commitMessage = title;
            scene.repo.createChange('a');
            scene.repo.execCliCommand(`branch create "a" -m "${commitMessage}" -q`);
            scene.repo.createChangeAndCommit(commitMessage);
            (0, chai_1.expect)((0, pr_title_1.inferPRTitle)('a', scene.getContext())).to.not.equals(title);
            (0, chai_1.expect)((0, pr_body_1.inferPRBody)('a', scene.getContext())).to.be.undefined;
        });
        it('aborts if the branch is empty', async () => {
            scene.repo.execCliCommand(`branch create "a" -m "a" -q`);
            await (0, chai_1.expect)((0, validate_branches_1.validateNoEmptyBranches)(['a'], scene.getContext())).to.be
                .rejected;
        });
        it('does not abort if the branch is not empty', async () => {
            scene.repo.createChange('a');
            scene.repo.execCliCommand(`branch create "a" -m "a" -q`);
            await (0, chai_1.expect)((0, validate_branches_1.validateNoEmptyBranches)(['a'], scene.getContext())).to.be
                .fulfilled;
        });
    });
}
//# sourceMappingURL=submit_action.test.js.map