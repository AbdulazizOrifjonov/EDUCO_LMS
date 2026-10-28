import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function syncStoragePlugin() {
  const dataDir = path.resolve(__dirname, './.data');
  const dbFile = path.resolve(dataDir, 'db.json');
  const uploadsDir = path.resolve(dataDir, 'uploads');
  const sseClients = new Set();

  const getDb = () => {
    try {
      if (fs.existsSync(dbFile)) {
        return JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
      }
    } catch (e) {}
    return null;
  };

  const saveDb = (data) => {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db:', e);
    }
  };

  const broadcastRealtime = (payload) => {
    const msg = `data: ${JSON.stringify(payload)}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(msg);
      } catch (_) {
        sseClients.delete(client);
      }
    });
  };

  return {
    name: 'sync-storage-plugin',
    configureServer(server) {
      // 1. Realtime Server-Sent Events (SSE) Stream
      server.middlewares.use('/api/realtime-stream', (req, res, next) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Accel-Buffering', 'no');
        if (typeof res.flushHeaders === 'function') {
          res.flushHeaders();
        }

        res.write(': connected\n\n');
        sseClients.add(res);

        const keepAlive = setInterval(() => {
          try {
            res.write(': ping\n\n');
          } catch (_) {
            clearInterval(keepAlive);
            sseClients.delete(res);
          }
        }, 15000);

        req.on('close', () => {
          clearInterval(keepAlive);
          sseClients.delete(res);
        });
      });

      // 2. Chat / Media Upload Endpoint
      server.middlewares.use('/api/chat/upload', (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'online', service: 'EDUCO SMS Gateway Proxy' }));
          return;
        }

        if (req.method === 'POST') {
          const contentType = req.headers['content-type'] || '';
          const chunks = [];
          req.on('data', (chunk) => chunks.push(chunk));
          req.on('end', () => {
            try {
              const fullBuffer = Buffer.concat(chunks);
              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
              }

              let savedFileName = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
              let fileBuffer = fullBuffer;

              const boundaryMatch = contentType.match(/boundary=([^\s;]+)/i);
              if (boundaryMatch) {
                const boundary = boundaryMatch[1];
                const boundaryBuf = Buffer.from('--' + boundary);
                const startIdx = fullBuffer.indexOf(boundaryBuf);
                if (startIdx !== -1) {
                  const headerStart = startIdx + boundaryBuf.length;
                  const headerEnd = fullBuffer.indexOf(Buffer.from('\r\n\r\n'), headerStart);
                  if (headerEnd !== -1) {
                    const headerStr = fullBuffer.slice(headerStart, headerEnd).toString('utf-8');
                    const fnMatch = headerStr.match(/filename="?([^";\r\n]+)"?/i);
                    if (fnMatch) {
                      const orig = fnMatch[1].trim();
                      const ext = path.extname(orig) || '';
                      const base = path.basename(orig, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
                      savedFileName = `${base}_${Date.now()}${ext || '.bin'}`;
                    }
                    const dataStart = headerEnd + 4;
                    const nextBoundary = fullBuffer.indexOf(boundaryBuf, dataStart);
                    let dataEnd = nextBoundary !== -1 ? nextBoundary : fullBuffer.length;
                    if (dataEnd > 2 && fullBuffer[dataEnd - 2] === 13 && fullBuffer[dataEnd - 1] === 10) {
                      dataEnd -= 2;
                    }
                    fileBuffer = fullBuffer.slice(dataStart, dataEnd);
                  }
                }
              }

              const targetFilePath = path.resolve(uploadsDir, savedFileName);
              fs.writeFileSync(targetFilePath, fileBuffer);

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  url: `/api/chat/media/${encodeURIComponent(savedFileName)}`,
                  fileName: savedFileName,
                  size: fileBuffer.length,
                })
              );
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        next();
      });

      // 3. Media Serving with Byte-Range seeking support for video and audio
      server.middlewares.use('/api/chat/media', (req, res, next) => {
        if (req.method === 'GET' || req.method === 'HEAD') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          const parsedUrl = req.url.split('?')[0].replace(/^\//, '');
          const cleanName = path.basename(decodeURIComponent(parsedUrl));
          const targetFilePath = path.resolve(uploadsDir, cleanName);

          if (fs.existsSync(targetFilePath) && fs.statSync(targetFilePath).isFile()) {
            const stat = fs.statSync(targetFilePath);
            const ext = path.extname(targetFilePath).toLowerCase();
            const mimeTypes = {
              '.mp4': 'video/mp4',
              '.webm': 'video/webm',
              '.mov': 'video/quicktime',
              '.mp3': 'audio/mpeg',
              '.wav': 'audio/wav',
              '.ogg': 'audio/ogg',
              '.oga': 'audio/ogg',
              '.m4a': 'audio/mp4',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp',
              '.pdf': 'application/pdf',
              '.txt': 'text/plain',
            };
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Accept-Ranges', 'bytes');

            const range = req.headers.range;
            if (range) {
              const parts = range.replace(/bytes=/, '').split('-');
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
              const chunksize = end - start + 1;
              res.statusCode = 206;
              res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
              res.setHeader('Content-Length', chunksize);
              fs.createReadStream(targetFilePath, { start, end }).pipe(res);
            } else {
              res.setHeader('Content-Length', stat.size);
              fs.createReadStream(targetFilePath).pipe(res);
            }
            return;
          }
        }
        next();
      });

      // 4. Store Sync with SSE Realtime Push
      server.middlewares.use('/api/sync-store', (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          const db = getDb();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(db || {}));
          return;
        }

        if (req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'online', service: 'EDUCO SMS Gateway Proxy' }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body || '{}');
              const current = getDb() || {};
              const merged = { ...current, ...incoming };
              saveDb(merged);
              broadcastRealtime({ type: 'SYNC', payload: incoming, timestamp: Date.now() });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, data: merged }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });

      // 5. SMS Gateway CORS Proxy for direct Android phone communication
      server.middlewares.use('/api/sms-proxy', (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'online', service: 'EDUCO SMS Gateway Proxy' }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const { url, method = 'POST', headers = {}, payload } = JSON.parse(body || '{}');
              if (!url) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'url is required' }));
                return;
              }

              // Demo / Simulation check for explicit placeholder tokens
              const authHeader = headers['Authorization'] || headers['authorization'] || '';
              const isSampleToken =
                authHeader.includes('demo_token_educo') ||
                url.includes('placeholder.domain');

              if (isSampleToken) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  simulated: true,
                  message: 'SMS qabul qiluvchi telefoniga muvaffaqiyatli uzatildi (Demo Gateway rejimi)',
                  timestamp: new Date().toISOString(),
                }));
                return;
              }

              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 12000);

              const fetchOptions = {
                method,
                headers: { ...headers },
                signal: controller.signal,
              };

              if (method !== 'GET' && method !== 'HEAD' && payload) {
                fetchOptions.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
                fetchOptions.headers['Content-Type'] = 'application/json';
              }

              const response = await fetch(url, fetchOptions);
              clearTimeout(timer);

              const respText = await response.text();
              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(respText || JSON.stringify({ status: response.status, ok: response.ok }));
            } catch (err) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });

      // 6. Autonomous 24/7 SMS Background Scheduler
      let isProcessingQueue = false;
      setInterval(async () => {
        if (isProcessingQueue) return;
        try {
          const db = getDb();
          if (!db) return;
          const settings = db.educo_db_sms_settings;
          if (!settings || !settings.is_enabled) return;

          const devices = db.educo_db_sms_devices || [];
          const activeDevice =
            devices.find((d) => d.device_role === 'primary' && d.is_active) ||
            devices.find((d) => d.device_role === 'backup' && d.is_active);
          if (!activeDevice || !activeDevice.gateway_url) return;

          // 1. Process Pending Queue Items
          const queue = db.educo_db_sms_queue || [];
          const nextItemIndex = queue.findIndex((q) => q.status === 'pending');
          if (nextItemIndex >= 0) {
            isProcessingQueue = true;
            const item = queue[nextItemIndex];
            item.status = 'processing';
            item.last_attempt_at = new Date().toISOString();
            saveDb(db);

            let targetUrl = activeDevice.gateway_url.trim();
            if (!/\/(message|messages|send|v1)/i.test(targetUrl)) {
              targetUrl = `${targetUrl.replace(/\/+$/, '')}/message`;
            }

            const headers = { 'Content-Type': 'application/json' };
            if (activeDevice.api_token) {
              const token = activeDevice.api_token.trim();
              if (token.includes(':')) {
                headers['Authorization'] = `Basic ${Buffer.from(token).toString('base64')}`;
              } else {
                headers['Authorization'] = `Bearer ${token}`;
              }
            }

            const payload = {
              phoneNumbers: [item.recipient_phone],
              to: item.recipient_phone,
              phone: item.recipient_phone,
              message: item.message_text,
              text: item.message_text,
            };

            const controller = new AbortController();
            const fetchTimer = setTimeout(() => controller.abort(), 12000);
            try {
              const res = await fetch(targetUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal,
              });
              clearTimeout(fetchTimer);

              if (res.ok || res.status === 200 || res.status === 201 || res.status === 202) {
                item.status = 'sent';
                item.sent_at = new Date().toISOString();
                item.error_message = null;
                db.educo_db_sms_logs = db.educo_db_sms_logs || [];
                db.educo_db_sms_logs.unshift({
                  id: `log-${Date.now()}`,
                  queue_id: item.id,
                  device_id: activeDevice.id,
                  device_name: activeDevice.name,
                  recipient_phone: item.recipient_phone,
                  recipient_name: item.recipient_name,
                  message_text: item.message_text,
                  status: 'sent',
                  sent_at: new Date().toISOString(),
                });
                console.log(`[SMS Gateway] ✅ SMS yuborildi: ${item.recipient_phone} (${item.recipient_name})`);
              } else {
                throw new Error(`HTTP ${res.status}`);
              }
            } catch (postErr) {
              item.attempts = (item.attempts || 0) + 1;
              const maxRetries = settings.max_retries || 3;
              item.status = item.attempts >= maxRetries ? 'failed' : 'pending';
              item.error_message = postErr.message;
              console.warn(`[SMS Gateway] ⚠️ Xatolik (${item.recipient_phone}):`, postErr.message);
            } finally {
              clearTimeout(fetchTimer);
              saveDb(db);
              broadcastRealtime({ type: 'SMS_UPDATE', timestamp: Date.now() });
              isProcessingQueue = false;
            }
          }
        } catch (_) {
          isProcessingQueue = false;
        }
      }, 5000);
    },
  };
}

export default defineConfig({
  plugins: [react(), syncStoragePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          supabase: ['@supabase/supabase-js'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          ui: ['lucide-react'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    css: true,
  },
});
