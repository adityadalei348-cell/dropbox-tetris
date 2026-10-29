import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { resolveUrl } from './resolver.js';
import { jobQueue } from './queue.js';

dotenv.config();

// Startup check for yt-dlp and ffmpeg
function checkPrerequisites() {
  console.log('Checking system prerequisites...');
  let ytDlpOk = false;
  try {
    execSync('yt-dlp --version', { stdio: 'ignore' });
    ytDlpOk = true;
  } catch (e) {
    try {
      execSync('python3 -m yt_dlp --version', { stdio: 'ignore' });
      ytDlpOk = true;
    } catch (e2) {}
  }

  if (!ytDlpOk) {
    console.error('❌ ERROR: yt-dlp is not installed or not in PATH.');
    console.error('Please install yt-dlp: pip3 install --user yt-dlp (or brew install yt-dlp)');
    process.exit(1);
  }
  console.log('✓ yt-dlp is installed.');

  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    console.log('✓ ffmpeg is installed.');
  } catch (e) {
    console.error('❌ ERROR: ffmpeg is not installed or not in PATH.');
    console.error('Please install ffmpeg (e.g. sudo apt install ffmpeg or brew install ffmpeg)');
    process.exit(1);
  }
}

checkPrerequisites();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Resolve URL metadata
app.post('/api/resolve', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const metadata = await resolveUrl(url);
    res.json(metadata);
  } catch (error: any) {
    console.error('Resolve error:', error);
    res.status(500).json({ error: error.message || 'Failed to resolve URL' });
  }
});

// Start download job
app.post('/api/download', (req: Request, res: Response) => {
  const { url, format, quality, title, author, thumbnail, type } = req.body;
  if (!url || !format) {
    return res.status(400).json({ error: 'URL and format are required' });
  }

  const source = url.includes('spotify.com') ? 'spotify' : 'youtube';
  const job = jobQueue.addJob(url, format, source, quality, title, author, thumbnail, type);
  res.json(job);
});

// SSE for job progress
app.get('/api/jobs/:id/events', (req: Request, res: Response) => {
  const { id } = req.params;
  const job = jobQueue.getJob(id);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial state
  res.write(`data: ${JSON.stringify(job)}\n\n`);

  const listener = (updatedJob: any) => {
    res.write(`data: ${JSON.stringify(updatedJob)}\n\n`);
    if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
      setTimeout(() => res.end(), 1000);
    }
  };

  jobQueue.subscribe(id, listener);

  req.on('close', () => {
    jobQueue.unsubscribe(id, listener);
  });
});

// Serve finished file
app.get('/api/files/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const DOWNLOAD_DIR = path.resolve('/tmp/dropbox-tetris-downloads');

  try {
    const files = fs.readdirSync(DOWNLOAD_DIR);
    const matched = files.find(f => f.startsWith(id));
    if (!matched) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(DOWNLOAD_DIR, matched);
    res.download(filePath, matched.substring(matched.indexOf('_') + 1));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Serve static client build if available (supports single-port deployment)
const possibleClientPaths = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(__dirname, '../../client/dist')
];

let clientDistPath = '';
for (const p of possibleClientPaths) {
  if (fs.existsSync(p)) {
    clientDistPath = p;
    break;
  }
}

if (clientDistPath) {
  console.log(`Serving static client from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

app.listen(Number(PORT), () => {
  console.log(`DropBox Tetris running on single port http://localhost:${PORT}`);
});
