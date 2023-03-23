"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.description = exports.canonical = exports.command = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const debug_context_1 = require("../../lib/debug_context");
const runner_1 = require("../../lib/runner");
const args = {
    recreate: {
        type: 'string',
        optional: true,
        alias: 'r',
        describe: 'Accepts a json block created by `gt feedback state`. Recreates a debug repo in a temp folder with a commit tree matching the state JSON.',
    },
    'recreate-from-file': {
        type: 'string',
        optional: true,
        alias: 'f',
        describe: 'Accepts a file containing a json block created by `gt feedback state`. Recreates a debug repo in a temp folder with a commit tree matching the state JSON.',
    },
};
exports.command = 'debug-context';
exports.canonical = 'feedback debug-context';
exports.description = 'Print a debug summary of your repo. Useful for creating bug report details.';
exports.builder = args;
const handler = async (argv) => {
    return (0, runner_1.graphite)(argv, exports.canonical, async (context) => {
        if (argv['recreate-from-file']) {
            const dir = (0, debug_context_1.recreateState)(fs_extra_1.default.readFileSync(argv['recreate-from-file']).toString(), context.splog);
            context.splog.info(`${chalk_1.default.green(dir)}`);
        }
        else if (argv.recreate) {
            const dir = (0, debug_context_1.recreateState)(argv.recreate, context.splog);
            context.splog.info(`${chalk_1.default.green(dir)}`);
        }
        else {
            context.splog.info((0, debug_context_1.captureState)(context));
        }
    });
};
exports.handler = handler;
//# sourceMappingURL=debug_context.js.map