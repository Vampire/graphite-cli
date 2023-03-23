"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postTelemetryInBackground = void 0;
const graphite_cli_routes_1 = require("@withgraphite/graphite-cli-routes");
const retyped_routes_1 = require("@withgraphite/retyped-routes");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const tmp_1 = __importDefault(require("tmp"));
const package_json_1 = require("../../package.json");
const user_config_spf_1 = require("../lib/spiffy/user_config_spf");
const spawn_1 = require("../lib/utils/spawn");
const tracer_1 = require("../lib/utils/tracer");
function saveTracesToTmpFile() {
    const tmpDir = tmp_1.default.dirSync();
    const json = tracer_1.tracer.flushJson();
    const tracesPath = path_1.default.join(tmpDir.name, 'traces.json');
    fs_extra_1.default.writeFileSync(tracesPath, json);
    return tracesPath;
}
function postTelemetryInBackground() {
    const tracesPath = saveTracesToTmpFile();
    (0, spawn_1.spawnDetached)(__filename, [tracesPath]);
}
exports.postTelemetryInBackground = postTelemetryInBackground;
async function postTelemetry() {
    const userConfig = user_config_spf_1.userConfigFactory.load();
    if (process.env.GRAPHITE_DISABLE_TELEMETRY) {
        return;
    }
    const tracesPath = process.argv[2];
    if (tracesPath && fs_extra_1.default.existsSync(tracesPath)) {
        // Failed to find traces file, exit
        try {
            await retyped_routes_1.request.requestWithArgs(userConfig.getApiServerUrl(), graphite_cli_routes_1.API_ROUTES.traces, {
                auth: user_config_spf_1.userConfigFactory.loadIfExists()?.getAuthToken(),
                jsonTraces: fs_extra_1.default.readFileSync(tracesPath).toString(),
                cliVersion: package_json_1.version,
            });
        }
        catch (err) {
            return;
        }
        // Cleanup despite it being a temp file.
        fs_extra_1.default.removeSync(tracesPath);
    }
}
if (process.argv[1] === __filename) {
    void postTelemetry();
}
//# sourceMappingURL=post_traces.js.map