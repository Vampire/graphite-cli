"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractDemo = void 0;
const child_process_1 = __importDefault(require("child_process"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const tmp_1 = __importDefault(require("tmp"));
const OUTPUT_DIR = `${__dirname}/../../demo`;
class AbstractDemo {
    name;
    commands;
    setup;
    constructor(name, commands, setup) {
        this.name = name;
        this.commands = commands;
        this.setup = setup;
    }
    outputFilePath() {
        return `${OUTPUT_DIR}/${this.name}.json`;
    }
    outputSvgPath() {
        return `${OUTPUT_DIR}/${this.name}.svg`;
    }
    outputGifPath() {
        return `${OUTPUT_DIR}/${this.name}.gif`;
    }
    record(demoDir) {
        const remainingCommands = [...this.commands].reverse();
        return new Promise((resolve, reject) => {
            // Start recording.
            if (fs_extra_1.default.existsSync(this.outputFilePath())) {
                fs_extra_1.default.removeSync(this.outputFilePath());
            }
            const recProcess = child_process_1.default.spawn('/usr/local/bin/asciinema', [
                'rec',
                this.outputFilePath(),
                '--stdin',
                '--overwrite',
                '--command',
                '$SHELL',
            ], {
                detached: true,
                cwd: demoDir,
            });
            recProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                    return;
                }
                console.log(`Closed with non-zero exit code`);
                reject();
                return;
            });
            recProcess.on('error', (err) => {
                console.error('Failed to start subprocess.');
                console.error(err);
                // eslint-disable-next-line no-restricted-syntax
                process.exit(1);
            });
            if (!recProcess) {
                throw new Error('Failed to spawn process');
            }
            if (!recProcess.stdin) {
                throw new Error('No stdin for subprocess');
            }
            recProcess.stdout.on('data', async function (data) {
                if (data.toString().includes('$') || data.toString().includes('➜')) {
                    if (remainingCommands.length > 0) {
                        writeCommand(recProcess, remainingCommands.pop());
                    }
                    else {
                        // End of tranmission character
                        recProcess.stdin.write(`\x04`);
                    }
                }
            });
            recProcess.on('', (err) => {
                console.error('Failed to start subprocess.');
                reject(err);
                return;
            });
        });
    }
    async create() {
        const tmpDir = tmp_1.default.dirSync();
        const demoDir = path_1.default.join(tmpDir.name, 'demo');
        fs_extra_1.default.mkdirSync(demoDir);
        console.log(`Setting up demo repo`);
        this.setup(demoDir);
        console.log(`Recording`);
        await this.record(demoDir);
        console.log(`Post processing`);
        this.postProcess();
        console.log(`Creating SVG`);
        child_process_1.default.execSync(`svg-term --in ${this.outputFilePath()} --out ${this.outputSvgPath()} --window`);
        console.log(`Creating Gif`);
        child_process_1.default.execSync(`GIFSICLE_OPTS="-k 16 -O3" asciicast2gif -t solarized-dark ${this.outputFilePath()} ${this.outputGifPath()}`);
        console.log(`Cleaning up`);
        fs_extra_1.default.emptyDirSync(tmpDir.name);
        tmpDir.removeCallback();
    }
    postProcess() {
        const lines = fs_extra_1.default
            .readFileSync(this.outputFilePath())
            .toString()
            .trim()
            .split('\n');
        lines.splice(1, 4);
        fs_extra_1.default.writeFileSync(this.outputFilePath(), lines.join('\n'));
    }
}
exports.AbstractDemo = AbstractDemo;
function writeCommand(process, command) {
    console.log(`Running command: ${command}`);
    child_process_1.default.execSync('sleep 3');
    for (const char of command) {
        process.stdin.write(char);
        child_process_1.default.execSync('sleep 0.01');
    }
    process.stdin.write('\n');
}
//# sourceMappingURL=abstract_demo.js.map