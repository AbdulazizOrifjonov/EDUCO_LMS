// Cloudflare Pages Advanced Edge Worker for EDUCO LMS
// Handles /api/sync-store, /api/chat/upload, /api/chat/media, /api/chat/seen, and falls back to static assets

// In-memory fallback if D1 is not bound yet
const memoryKV = new Map();
const memoryMedia = new Map();

// Helper to return JSON with CORS headers
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

// Ensure D1 table exists
async function initD1Tables(db) {
  if (!db) return;
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS media_blobs (
        id TEXT PRIMARY KEY,
        mime_type TEXT,
        data_base64 TEXT,
        created_at TEXT
      );
    `);
  } catch (err) {
    console.warn('D1 init table error:', err);
  }
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }

      // --- API: REALTIME EVENT SOURCE STREAM (/api/realtime-stream) ---
      if (url.pathname === '/api/realtime-stream') {
        return new Response(': keep-alive\n\n', {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

    // --- API: SMS GATEWAY CORS PROXY (/api/sms-proxy) ---
    if (url.pathname === '/api/sms-proxy') {
      if (request.method === 'GET') {
        return jsonResponse({
          status: 'online',
          service: 'EDUCO SMS Gateway Proxy',
          timestamp: new Date().toISOString(),
        }, 200);
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json().catch(() => ({}));
          const { url: targetUrl, method = 'POST', headers = {}, payload } = body;
          if (!targetUrl) {
            return jsonResponse({ error: 'url is required' }, 400);
          }

          // Demo / Simulation check: if targetUrl has the sample token, is placeholder demo, or local IP in cloud environment
          const authHeader = headers['Authorization'] || headers['authorization'] || '';
          const isSampleToken =
            authHeader.includes('SXP6_F:_8_-fv9uvdsyrp') ||
            authHeader.includes('educo_gw_backup_secret') ||
            /demo|sample|test/i.test(authHeader) ||
            /placeholder|example\.com|demo|test/i.test(targetUrl) ||
            targetUrl.includes('192.168.') ||
            targetUrl.includes('10.') ||
            targetUrl.includes('localhost') ||
            targetUrl.includes('127.0.0.1');

          if (isSampleToken) {
            return jsonResponse({
              success: true,
              simulated: true,
              message: 'SMS qabul qiluvchi telefoniga muvaffaqiyatli uzatildi (Test / Gateway rejimi)',
              timestamp: new Date().toISOString(),
            }, 200);
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

          let response;
          try {
            response = await fetch(targetUrl, fetchOptions);
          } catch (netErr) {
            clearTimeout(timer);
            return jsonResponse({
              error: `SMS Gateway bilan aloqa o‘rnatilmadi: ${netErr.message || 'Tarmoq xatosi'}. Agar qurilma lokal Wi-Fi (192.168.x.x) bo‘lsa, u faqat bir xil Wi-Fi tarmog‘ida ishlaydi.`,
              offline: true,
            }, 502);
          }
          clearTimeout(timer);

          const respText = await response.text();
          let parsed = null;
          try {
            parsed = JSON.parse(respText);
          } catch {
            parsed = { status: response.status, ok: response.ok, body: respText };
          }

          return new Response(JSON.stringify(parsed), {
            status: response.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
          });
        } catch (err) {
          return jsonResponse({ error: err.message || 'SMS Gateway proxy error' }, 502);
        }
      }
    }

    // --- API: STORE SYNC (/api/sync-store) ---
    if (url.pathname === '/api/sync-store') {
      const db = env.DB;
      if (db) await initD1Tables(db);

      // GET /api/sync-store - Fetch all shared data
      if (request.method === 'GET') {
        const store = {};

        if (db) {
          try {
            const { results } = await db.prepare('SELECT key, value FROM kv_store').all();
            if (results && results.length > 0) {
              for (const row of results) {
                try {
                  store[row.key] = JSON.parse(row.value);
                } catch {
                  store[row.key] = row.value;
                }
              }
            }
          } catch (e) {
            console.warn('D1 fetch error:', e);
          }
        }

        // Fill in missing keys from memory cache
        for (const [k, v] of memoryKV.entries()) {
          if (!store[k]) store[k] = v;
        }

        return jsonResponse(store);
      }

      // POST /api/sync-store - Save/merge shared data
      if (request.method === 'POST') {
        try {
          const payload = await request.json();
          if (payload && typeof payload === 'object') {
            const now = new Date().toISOString();

            for (const [key, value] of Object.entries(payload)) {
              memoryKV.set(key, value);

              if (db) {
                try {
                  const valStr = JSON.stringify(value);
                  await db
                    .prepare(
                      'INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
                    )
                    .bind(key, valStr, now)
                    .run();
                } catch (e) {
                  console.warn(`D1 save error for ${key}:`, e);
                }
              }
            }
          }
          return jsonResponse({ success: true, timestamp: new Date().toISOString() });
        } catch (err) {
          return jsonResponse({ error: err.message }, 400);
        }
      }
    }

    // --- API: CHAT MEDIA UPLOAD (/api/chat/upload) ---
    if (url.pathname === '/api/chat/upload' && request.method === 'POST') {
      try {
        const db = env.DB;
        if (db) await initD1Tables(db);

        const contentType = request.headers.get('content-type') || '';
        let fileName = 'file';
        let mimeType = 'application/octet-stream';
        let fileBytes = null;
        let base64Data = null;

        if (contentType.includes('multipart/form-data')) {
          const formData = await request.formData();
          const file = formData.get('file');
          if (file && file instanceof File) {
            fileName = file.name;
            mimeType = file.type || 'application/octet-stream';
            fileBytes = await file.arrayBuffer();
          }
        } else if (contentType.includes('application/json')) {
          const json = await request.json();
          fileName = json.name || 'recording.webm';
          mimeType = json.type || 'video/webm';
          base64Data = json.base64;
          if (base64Data) {
            // Strip data: prefix if present
            const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
            const binary = atob(cleanBase64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            fileBytes = bytes.buffer;
          }
        } else {
          // Direct binary stream
          mimeType = contentType;
          fileName = request.headers.get('x-file-name') || `media_${Date.now()}`;
          fileBytes = await request.arrayBuffer();
        }

        if (!fileBytes && !base64Data) {
          return jsonResponse({ error: 'No file data received' }, 400);
        }

        const ext = fileName.includes('.') ? fileName.split('.').pop() : (mimeType.includes('video') ? 'webm' : 'jpg');
        const mediaId = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // 1. If R2 bucket is bound, put into R2
        const r2 = env.R2 || env.MEDIA_BUCKET;
        if (r2 && fileBytes) {
          await r2.put(mediaId, fileBytes, {
            httpMetadata: { contentType: mimeType },
          });
        }

        // 2. If D1 is bound, store binary as base64 in media_blobs
        if (db) {
          try {
            if (!base64Data && fileBytes) {
              const u8 = new Uint8Array(fileBytes);
              let binary = '';
              const chunkSize = 8192;
              for (let i = 0; i < u8.length; i += chunkSize) {
                binary += String.fromCharCode.apply(null, u8.subarray(i, i + chunkSize));
              }
              base64Data = btoa(binary);
            }
            await db
              .prepare('INSERT OR REPLACE INTO media_blobs (id, mime_type, data_base64, created_at) VALUES (?, ?, ?, ?)')
              .bind(mediaId, mimeType, base64Data, new Date().toISOString())
              .run();
          } catch (e) {
            console.warn('D1 media save fallback:', e);
          }
        }

        // 3. In-memory cache as well
        if (fileBytes) {
          memoryMedia.set(mediaId, { bytes: fileBytes, mimeType });
        }

        const mediaUrl = `/api/chat/media/${mediaId}`;
        return jsonResponse({
          success: true,
          id: mediaId,
          url: mediaUrl,
          file_name: fileName,
          file_type: mimeType,
          file_size: fileBytes ? fileBytes.byteLength : 0,
        });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // --- API: CHAT MEDIA RETRIEVAL (/api/chat/media/:id) ---
    if (url.pathname.startsWith('/api/chat/media/')) {
      const mediaId = url.pathname.replace('/api/chat/media/', '').trim();
      const r2 = env.R2 || env.MEDIA_BUCKET;
      const db = env.DB;

      // 1. Try R2
      if (r2) {
        try {
          const obj = await r2.get(mediaId);
          if (obj) {
            return new Response(obj.body, {
              headers: {
                'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
              },
            });
          }
        } catch (e) {}
      }

      // 2. Try D1
      if (db) {
        try {
          const row = await db.prepare('SELECT mime_type, data_base64 FROM media_blobs WHERE id = ?').bind(mediaId).first();
          if (row && row.data_base64) {
            const binary = atob(row.data_base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            return new Response(bytes.buffer, {
              headers: {
                'Content-Type': row.mime_type || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
              },
            });
          }
        } catch (e) {}
      }

      // 3. Try Memory Cache
      if (memoryMedia.has(mediaId)) {
        const item = memoryMedia.get(mediaId);
        return new Response(item.bytes, {
          headers: {
            'Content-Type': item.mimeType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      return new Response('Media Not Found', { status: 404 });
    }

    // --- API: MARK MESSAGE AS SEEN (/api/chat/seen) ---
    if (url.pathname === '/api/chat/seen' && request.method === 'POST') {
      try {
        const { messageId, user } = await request.json();
        if (!messageId || !user) {
          return jsonResponse({ error: 'messageId and user required' }, 400);
        }

        const db = env.DB;
        let messages = memoryKV.get('educo_db_chat_messages') || [];

        if (db) {
          try {
            const row = await db.prepare("SELECT value FROM kv_store WHERE key = 'educo_db_chat_messages'").first();
            if (row && row.value) {
              messages = JSON.parse(row.value);
            }
          } catch (e) {}
        }

        const msgIndex = messages.findIndex((m) => m.id === messageId);
        if (msgIndex >= 0) {
          const msg = messages[msgIndex];
          const isStaffChat = msg.group_id === 'staff-general-chat';

          // SECURITY GUARD: Never allow students in staff chat seen receipts
          if (isStaffChat && user.user_role === 'student') {
            return jsonResponse({ error: 'Students not permitted in staff chat' }, 403);
          }

          if (!msg.seen_by) msg.seen_by = [];
          const alreadyIdx = msg.seen_by.findIndex((s) => s.user_id === user.user_id);
          if (alreadyIdx >= 0) {
            // Update name and role if previously saved as generic 'User' / 'student'
            if (user.user_name && user.user_name !== 'User') {
              msg.seen_by[alreadyIdx].user_name = user.user_name;
            }
            if (user.user_role && user.user_role !== 'student') {
              msg.seen_by[alreadyIdx].user_role = user.user_role;
            }
            if (user.avatar_url) {
              msg.seen_by[alreadyIdx].avatar_url = user.avatar_url;
            }
          } else {
            msg.seen_by.push({
              user_id: user.user_id,
              user_name: user.user_name || 'Xodim',
              user_role: user.user_role || (isStaffChat ? 'teacher' : 'student'),
              avatar_url: user.avatar_url || '',
              seen_at: new Date().toISOString(),
            });
          }

          // Sanitize: Clean up any invalid student entries in staff chat
          if (isStaffChat) {
            msg.seen_by = msg.seen_by.filter((s) => s.user_role !== 'student' && s.user_name !== 'User');
          }

          messages[msgIndex] = msg;
          memoryKV.set('educo_db_chat_messages', messages);

          if (db) {
            try {
              await db
                .prepare(
                  "INSERT INTO kv_store (key, value, updated_at) VALUES ('educo_db_chat_messages', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
                )
                .bind(JSON.stringify(messages), new Date().toISOString())
                .run();
            } catch (e) {}
          }
          return jsonResponse({ success: true, seen_by: msg.seen_by });
        }
        return jsonResponse({ error: 'Message not found' }, 404);
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // For everything else, serve static frontend assets with SPA fallback on 404
    try {
      let assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status === 404 && request.method === 'GET' && !url.pathname.includes('.')) {
        const indexUrl = new URL('/index.html', request.url);
        assetResponse = await env.ASSETS.fetch(new Request(indexUrl, {
          method: 'GET',
          headers: request.headers,
        }));
      }
      return assetResponse;
    } catch (assetErr) {
      console.warn('Asset fetch fallback:', assetErr);
      return new Response('Asset Not Found', { status: 404 });
    }
  } catch (workerErr) {
    console.error('Worker top-level error:', workerErr);
    try {
      return await env.ASSETS.fetch(request);
    } catch {
      return new Response('Server Error', { status: 500 });
    }
  }
},
};
