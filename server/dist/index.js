"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_child_process_1 = require("node:child_process");
const resolver_js_1 = require("./resolver.js");
const queue_js_1 = require("./queue.js");
dotenv_1.default.config();
// Startup check for yt-dlp and ffmpeg
function checkPrerequisites() {
    console.log('Checking system prerequisites...');
    let ytDlpOk = false;
    try {
        (0, node_child_process_1.execSync)('yt-dlp --version', { stdio: 'ignore' });
        ytDlpOk = true;
    }
    catch (e) {
        try {
            (0, node_child_process_1.execSync)('python3 -m yt_dlp --version', { stdio: 'ignore' });
            ytDlpOk = true;
        }
        catch (e2) { }
    }
    if (!ytDlpOk) {
        console.error('❌ ERROR: yt-dlp is not installed or not in PATH.');
        console.error('Please install yt-dlp: pip3 install --user yt-dlp (or brew install yt-dlp)');
        process.exit(1);
    }
    console.log('✓ yt-dlp is installed.');
    try {
        (0, node_child_process_1.execSync)('ffmpeg -version', { stdio: 'ignore' });
        console.log('✓ ffmpeg is installed.');
    }
    catch (e) {
        console.error('❌ ERROR: ffmpeg is not installed or not in PATH.');
        console.error('Please install ffmpeg (e.g. sudo apt install ffmpeg or brew install ffmpeg)');
        process.exit(1);
    }
}
checkPrerequisites();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});
// Resolve URL metadata
app.post('/api/resolve', async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL is required' });
    }
    try {
        const metadata = await (0, resolver_js_1.resolveUrl)(url);
        res.json(metadata);
    }
    catch (error) {
        console.error('Resolve error:', error);
        res.status(500).json({ error: error.message || 'Failed to resolve URL' });
    }
});
// Start download job
app.post('/api/download', (req, res) => {
    const { url, format, quality, title, author, thumbnail, type } = req.body;
    if (!url || !format) {
        return res.status(400).json({ error: 'URL and format are required' });
    }
    const source = url.includes('spotify.com') ? 'spotify' : 'youtube';
    const job = queue_js_1.jobQueue.addJob(url, format, source, quality, title, author, thumbnail, type);
    res.json(job);
});
// SSE for job progress
app.get('/api/jobs/:id/events', (req, res) => {
    const { id } = req.params;
    const job = queue_js_1.jobQueue.getJob(id);
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Send initial state
    res.write(`data: ${JSON.stringify(job)}\n\n`);
    const listener = (updatedJob) => {
        res.write(`data: ${JSON.stringify(updatedJob)}\n\n`);
        if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            setTimeout(() => res.end(), 1000);
        }
    };
    queue_js_1.jobQueue.subscribe(id, listener);
    req.on('close', () => {
        queue_js_1.jobQueue.unsubscribe(id, listener);
    });
});
// Serve finished file
app.get('/api/files/:id', (req, res) => {
    const { id } = req.params;
    const DOWNLOAD_DIR = node_path_1.default.resolve('/tmp/dropbox-tetris-downloads');
    try {
        const files = node_fs_1.default.readdirSync(DOWNLOAD_DIR);
        const matched = files.find(f => f.startsWith(id));
        if (!matched) {
            return res.status(404).json({ error: 'File not found' });
        }
        const filePath = node_path_1.default.join(DOWNLOAD_DIR, matched);
        res.download(filePath, matched.substring(matched.indexOf('_') + 1));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Serve static client build if available (supports single-port deployment)
const possibleClientPaths = [
    node_path_1.default.resolve(process.cwd(), 'client/dist'),
    node_path_1.default.resolve(process.cwd(), '../client/dist'),
    node_path_1.default.resolve(__dirname, '../../client/dist')
];
let clientDistPath = '';
for (const p of possibleClientPaths) {
    if (node_fs_1.default.existsSync(p)) {
        clientDistPath = p;
        break;
    }
}
if (clientDistPath) {
    console.log(`Serving static client from ${clientDistPath}`);
    app.use(express_1.default.static(clientDistPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(node_path_1.default.join(clientDistPath, 'index.html'));
        }
    });
}
app.listen(Number(PORT), () => {
    console.log(`DropBox Tetris running on single port http://localhost:${PORT}`);
});
