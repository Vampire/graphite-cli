"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commit = void 0;
const errors_1 = require("../errors");
const exec_sync_1 = require("../utils/exec_sync");
const EMPTY_COMMIT_MESSAGE_INFO = [
    '\n',
    '# Since no changes were staged before creating this new branch,',
    '# Graphite has added an empty commit to track dependencies.',
    '# This is because two branches referencing one commit would break parent-child inference for Graphite',
    '#',
    '# You can remove the empty commit by running \\`gt commit amend\\`, or by squashing',
    '# If you wish to avoid empty commits in the future, stage changes before running \\`gt bc -m \\"feat(new_feat): added xyz...\\"\\`',
].join('\n');
function commit(opts) {
    // We must escape all backticks in the string
    const message = opts.message?.replace(/`/g, '\\`');
    (0, exec_sync_1.gpExecSync)({
        command: [
            'git commit',
            opts.amend ? `--amend` : '',
            opts.allowEmpty ? `--allow-empty` : '',
            message
                ? `-m "${message}"`
                : opts.allowEmpty
                    ? `-t ${stringToTmpFileInput(EMPTY_COMMIT_MESSAGE_INFO)}`
                    : '',
            opts.noEdit ? `--no-edit` : '',
            opts.noVerify ? '-n' : '',
        ].join(' '),
        options: {
            stdio: 'inherit',
            shell: '/bin/bash',
        },
    }, (err) => {
        opts.rollbackOnError?.();
        throw new errors_1.ExitFailedError('Failed to commit changes. Aborting...', err);
    });
}
exports.commit = commit;
function stringToTmpFileInput(contents) {
    return `<(printf '%s\n' "${contents}")`;
}
//# sourceMappingURL=commit.js.map