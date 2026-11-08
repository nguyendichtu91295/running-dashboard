import { createServer } from 'node:http';
import { loadEnvFile } from 'node:process';
import { GarminClient } from './garmin.js';
import { Store, SyncService } from './sync.js';
try { loadEnvFile(); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
const store = new Store(process.env.SQLITE_PATH ?? 'activities.sqlite');
const sync = new SyncService(store, new GarminClient(process.env.GARMIN_PERSONAL_API_KEY ?? ''));
const server = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'GET' && req.url === '/sync/status') { res.end(JSON.stringify(sync.status())); return; }
  if (req.method === 'POST' && req.url === '/sync') {
    if (sync.status()?.state === 'running') { res.writeHead(409); res.end(JSON.stringify({ error: 'Sync already running' })); return; }
    void sync.sync(process.env.SYNC_START_DATE, process.env.SYNC_END_DATE).catch(() => {});
    res.writeHead(202); res.end(JSON.stringify({ status: 'started' })); return;
  }
  res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' }));
});
server.listen(Number(process.env.PORT ?? 3000), '127.0.0.1', () => {
  void sync.sync(process.env.SYNC_START_DATE, process.env.SYNC_END_DATE).catch(() => {});
});
