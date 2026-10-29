"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobQueue = void 0;
const downloader_js_1 = require("./downloader.js");
class JobQueue {
    jobs = new Map();
    listeners = new Map();
    queue = [];
    activeCount = 0;
    maxConcurrency = 2;
    addJob(url, format, source, quality, title, author, thumbnail, type) {
        const id = Math.random().toString(36).substring(2, 10);
        const job = {
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
    getJob(id) {
        return this.jobs.get(id);
    }
    subscribe(id, listener) {
        if (!this.listeners.has(id)) {
            this.listeners.set(id, []);
        }
        this.listeners.get(id).push(listener);
    }
    unsubscribe(id, listener) {
        const list = this.listeners.get(id);
        if (list) {
            this.listeners.set(id, list.filter(l => l !== listener));
        }
    }
    notify(job) {
        const list = this.listeners.get(job.id);
        if (list) {
            list.forEach(l => l(job));
        }
    }
    processNext() {
        if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
            return;
        }
        const id = this.queue.shift();
        if (!id)
            return;
        const job = this.jobs.get(id);
        if (!job)
            return;
        this.activeCount++;
        job.status = 'downloading';
        this.notify(job);
        const source = job.url.includes('spotify.com') ? 'spotify' : 'youtube';
        (0, downloader_js_1.startDownload)({
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
exports.jobQueue = new JobQueue();
