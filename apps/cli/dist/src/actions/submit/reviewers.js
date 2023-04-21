"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviewers = void 0;
const prompts_1 = __importDefault(require("prompts"));
const errors_1 = require("../../lib/errors");
async function getReviewers(reviewers) {
    if (typeof reviewers === 'undefined') {
        return [];
    }
    if (reviewers === '') {
        const response = await (0, prompts_1.default)({
            type: 'list',
            name: 'reviewers',
            message: 'Reviewers (comma-separated GitHub usernames)',
            separator: ',',
        }, {
            onCancel: () => {
                throw new errors_1.KilledError();
            },
        });
        return response.reviewers;
    }
    return reviewers.split(',').map((reviewer) => reviewer.trim());
}
exports.getReviewers = getReviewers;
//# sourceMappingURL=reviewers.js.map