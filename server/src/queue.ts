import { DownloadJob, FormatType, SourceType } from './types.js';
import { startDownload } from './downloader.js';

class JobQueue {
  private jobs: Map<string, DownloadJob> = new Map();
  private listeners: Map<string, Array<(job: DownloadJob) => void>> = new Map();
  private queue: string[] = [];
  private activeCount = 0;
  private maxConcurrency = 2;

  public addJob(url: string, format: FormatType, source: SourceType, quality?: string, title?: string, author?: string, thumbnail?: string, type?: string): DownloadJob {
    const id = Math.random().toString(36).substring(2, 10);
    const job: DownloadJob = {
      id,
      url,
      format,
      quality,
      title,
      author,
      thumbnail,
      type,
      status: 'queued',
      progress: 0,
      createdAt: Date.now()
    };

    this.jobs.set(id, job);
    this.queue.push(id);
    this.processNext();
    return job;
  }

  public getJob(id: string): DownloadJob | undefined {
    return this.jobs.get(id);
  }

  public subscribe(id: string, listener: (job: DownloadJob) => void) {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, []);
    }
    this.listeners.get(id)!.push(listener);
  }

  public unsubscribe(id: string, listener: (job: DownloadJob) => void) {
    const list = this.listeners.get(id);
    if (list) {
      this.listeners.set(id, list.filter(l => l !== listener));
    }
  }

  private notify(job: DownloadJob) {
    const list = this.listeners.get(job.id);
    if (list) {
      list.forEach(l => l(job));
    }
  }

  private processNext() {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const id = this.queue.shift();
    if (!id) return;

    const job = this.jobs.get(id);
    if (!job) return;

    this.activeCount++;
    job.status = 'downloading';
    this.notify(job);

    const source: SourceType = job.url.includes('spotify.com') ? 'spotify' : 'youtube';

    startDownload({
      jobId: job.id,
      url: job.url,
      format: job.format,
      source,
      quality: job.quality,
      title: job.title,
      author: job.author,
      thumbnail: job.thumbnail,
      type: job.type,
      onProgress: (progress, speed, eta) => {
        job.progress = progress;
        job.speed = speed;
        job.eta = eta;
        this.notify(job);
      },
      onComplete: (filePath, filename) => {
        job.status = 'completed';
        job.progress = 100;
        job.filePath = filePath;
        job.filename = filename;
        this.activeCount--;
        this.notify(job);
        this.processNext();
      },
      onError: (error) => {
        job.status = 'failed';
        job.error = error;
        this.activeCount--;
        this.notify(job);
        this.processNext();
      }
    });
  }
}

export const jobQueue = new JobQueue();
