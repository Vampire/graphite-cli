"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.description = exports.canonical = exports.command = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const tmp_1 = __importDefault(require("tmp"));
const metadata_ref_1 = require("../../lib/engine/metadata_ref");
const runner_1 = require("../../lib/runner");
const cute_string_1 = require("../../lib/utils/cute_string");
const args = {
    branch: {
        demandOption: true,
        type: 'string',
        positional: true,
        hidden: true,
    },
    edit: {
        type: 'boolean',
        default: false,
        alias: 'e',
    },
};
exports.command = 'meta <branch>';
exports.canonical = 'dev meta';
exports.description = false;
exports.builder = args;
const handler = async (argv) => {
    return (0, runner_1.graphite)(argv, exports.canonical, async (context) => {
        const metaString = (0, cute_string_1.cuteString)((0, metadata_ref_1.readMetadataRef)(argv.branch));
        if (!argv.edit) {
            context.splog.info(metaString);
            return;
        }
        const tmpfilePath = path_1.default.join(tmp_1.default.dirSync().name, 'meta');
        fs_extra_1.default.writeFileSync(tmpfilePath, metaString);
        context.userConfig.execEditor(tmpfilePath);
        (0, metadata_ref_1.writeMetadataRef)(argv.branch, fs_extra_1.default.readJSONSync(tmpfilePath));
        context.engine.rebuild();
    });
};
exports.handler = handler;
//# sourceMappingURL=meta.js.map