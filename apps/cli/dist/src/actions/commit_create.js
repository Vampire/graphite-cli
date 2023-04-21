"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitCreateAction = void 0;
const scope_spec_1 = require("../lib/engine/scope_spec");
const preconditions_1 = require("../lib/preconditions");
const errors_1 = require("../lib/errors");
const restack_1 = require("./restack");
function commitCreateAction(opts, context) {
    if (context.engine.rebaseInProgress()) {
        throw new errors_1.BlockedDuringRebaseError();
    }
    if (opts.addAll) {
        context.engine.addAll();
    }
    (0, preconditions_1.ensureSomeStagedChangesPrecondition)(context);
    context.engine.commit({
        message: opts.message,
        patch: !opts.addAll && opts.patch,
    });
    (0, restack_1.restackBranches)(context.engine.getRelativeStack(context.engine.currentBranchPrecondition, scope_spec_1.SCOPE.UPSTACK_EXCLUSIVE), context);
}
exports.commitCreateAction = commitCreateAction;
//# sourceMappingURL=commit_create.js.map