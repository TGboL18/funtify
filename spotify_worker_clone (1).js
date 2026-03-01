// Spotify-like clone for Cloudflare Workers
// Features:
// - KV as metadata storage (bind as SONGS_KV)
// - /           -> HTML frontend (lists songs, plays stream)
// - /song/list  -> JSON list of songs
// - /song/add   -> POST JSON (admin) to add a song metadata
// - /stream?id= -> Proxies the audio file from Telegram using bot token
// - /webhook    -> Telegram webhook: accepts forwarded songs (audio, voice, document)
// Requirements (set as Worker environment variables / bindings):
// - Songs KV namespace bound as `SONGS_KV`
// - TELEGRAM_TOKEN  (secret)
// - ADMIN_KEY       (secret string used to protect /song/add)
// - SITE_TITLE      (optional) e.g. "My Music"

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url)
      const pathname = url.pathname.replace(/\/+$/, '') || '/'

      if (request.method === 'POST' && pathname === '/webhook') {
        return handleTelegramWebhook(request, env)
      }

      if (request.method === 'GET' && pathname === '/') {
        return serveHomePage(env)
      }

      if (pathname === '/song/list' && request.method === 'GET') {
        return listSongsHandler(env)
      }

      if (pathname === '/song/add' && request.method === 'POST') {
        return addSongHandler(request, env)
      }

      if (pathname === '/stream' && request.method === 'GET') {
        return streamHandler(url.searchParams.get('id'), env)
      }

      return new Response('Not found', { status: 404 })
    } catch (err) {
      return new Response('Server error: ' + err.stack, { status: 500 })
    }
  }
}

// ---------- KV helpers ----------
async function getIndex(env) {
  const raw = await env.SONGS_KV.get('songs:index')
  if (!raw) return []
  try { return JSON.parse(raw) } catch (e) { return [] }
}

async function saveIndex(env, arr) {
  await env.SONGS_KV.put('songs:index', JSON.stringify(arr))
}

async function saveSong(env, song) {
  if (!song.id) throw new Error('song.id required')
  await env.SONGS_KV.put(`song:${song.id}`, JSON.stringify(song))
  const idx = await getIndex(env)
  if (!idx.includes(song.id)) {
    idx.unshift(song.id) // newest first
    // keep index from growing too huge (optional)
    if (idx.length > 1000) idx.length = 1000
    await saveIndex(env, idx)
  }
}

async function getSong(env, id) {
  const raw = await env.SONGS_KV.get(`song:${id}`)
  if (!raw) return null
  try { return JSON.parse(raw) } catch (e) { return null }
}

async function listSongs(env, limit = 200) {
  const idx = await getIndex(env)
  const slice = idx.slice(0, limit)
  const list = await Promise.all(slice.map(id => getSong(env, id)))
  return list.filter(Boolean)
}

// ---------- Handlers ----------
async function listSongsHandler(env) {
  const songs = await listSongs(env)
  return jsonResponse({ ok: true, count: songs.length, songs })
}

async function addSongHandler(request, env) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('X-API-KEY')
  if (!env.ADMIN_KEY || apiKey !== env.ADMIN_KEY) {
    return new Response('Unauthorized', { status: 401 })
  }
  let body
  try { body = await request.json() } catch (e) { return new Response('Bad JSON', { status: 400 }) }
  // Expected fields: title, artist, tg_file_id, duration, mime
  if (!body.title || !body.tg_file_id) return new Response('title and tg_file_id required', { status: 400 })
  const id = body.id || generateId(body.tg_file_id)
  const song = {
    id,
    title: body.title,
    artist: body.artist || 'Unknown',
    tg_file_id: body.tg_file_id,
    duration: body.duration || null,
    mime: body.mime || null,
    uploader: body.uploader || 'web',
    created_at: new Date().toISOString(),
  }
  await saveSong(env, song)
  return jsonResponse({ ok: true, song })
}

async function streamHandler(id, env) {
  if (!id) return new Response('Missing id', { status: 400 })
  const song = await getSong(env, id)
  if (!song) return new Response('Song not found', { status: 404 })
  if (!song.tg_file_id) return new Response('Song has no tg_file_id', { status: 404 })
  if (!env.TELEGRAM_TOKEN) return new Response('Server misconfigured: TELEGRAM_TOKEN required', { status: 500 })

  // 1) getFile to obtain file path
  const tgGetFile = `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/getFile?file_id=${song.tg_file_id}`
  const gf = await fetch(tgGetFile)
  const gfJson = await gf.json()
  if (!gfJson.ok) return new Response('Failed to get file from Telegram', { status: 502 })
  const file_path = gfJson.result && gfJson.result.file_path
  if (!file_path) return new Response('Telegram returned no file_path', { status: 502 })

  const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_TOKEN}/${file_path}`
  // Proxy the file
  const downstream = await fetch(fileUrl)
  if (!downstream.ok) return new Response('Failed to fetch file from Telegram', { status: 502 })
  // forward headers such as content-type and length
  const headers = new Headers(downstream.headers)
  // Add caching and CORS for browser audio
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Cache-Control', 'public, max-age=300')
  return new Response(downstream.body, { status: downstream.status, headers })
}

async function handleTelegramWebhook(request, env) {
  if (!env.TELEGRAM_TOKEN) return new Response('TELEGRAM_TOKEN not configured', { status: 500 })
  let body
  try { body = await request.json() } catch (e) { return new Response('Bad JSON from Telegram', { status: 400 }) }
  const message = body.message || body.edited_message || body.channel_post || body.callback_query && body.callback_query.message
  if (!message) return new Response('no message', { status: 200 })

  // Look for audio in several places
  const audio = message.audio || message.voice || message.document || message.video_note || null
  if (!audio) {
    // Not an audio file; ignore but respond 200 to Telegram
    return new Response('no audio', { status: 200 })
  }

  // For document, ensure mime looks like audio
  if (message.document && message.document.mime_type && !message.document.mime_type.startsWith('audio')) {
    // ignore non-audio documents
    // but some voice messages arrive as document with audio mime
  }

  const file_id = audio.file_id
  const title = (message.audio && message.audio.title) || (message.document && (message.document.file_name || message.document.mime_type)) || message.caption || `Telegram-${file_id.slice(-6)}`
  const artist = message.from ? `${message.from.first_name || ''} ${message.from.last_name || ''}`.trim() : 'Telegram user'
  const duration = audio.duration || null

  const id = generateId(file_id)
  const song = {
    id,
    title,
    artist: artist || 'Unknown',
    tg_file_id: file_id,
    duration,
    mime: (audio.mime_type || null),
    uploader: message.from ? `${message.from.id}` : 'telegram',
    telegram_message: {
      message_id: message.message_id || null,
      chat_id: message.chat && message.chat.id || null
    },
    created_at: new Date().toISOString(),
  }

  await saveSong(env, song)

  // Optionally send a small reply to the chat to confirm (requires chat_id)
  // We'll avoid replying to avoid spam; implement if you want.

  return new Response('ok', { status: 200 })
}

// ---------- Frontend HTML ----------
function serveHomePage(env) {
  const title = env.SITE_TITLE || 'My Music'
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta name="theme-color" content="#000000">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>${escapeHtml(title)}</title>
  <style>
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #000000;
      color: #ffffff;
      line-height: 1.5;
    }

    /* Header with Manila Time */
    header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: linear-gradient(180deg, #000000 0%, #0a0a0a 100%);
      padding: 20px 16px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .site-title {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(90deg, #1db954, #1ed760);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Manila Time Display */
    .time-container {
      text-align: right;
    }

    .manila-time {
      font-size: 20px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: 0.5px;
    }

    .manila-date {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      margin-top: 2px;
    }

    .timezone-label {
      font-size: 10px;
      color: rgba(255,255,255,0.4);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Container */
    .container {
      padding: 16px;
      padding-bottom: 140px;
    }

    /* Search */
    .search-wrapper {
      position: sticky;
      top: 100px;
      z-index: 90;
      background: #000000;
      padding: 12px 0;
      margin: -12px 0 8px;
    }

    .search {
      width: 100%;
      padding: 14px 16px;
      font-size: 16px;
      border: none;
      border-radius: 12px;
      background: #1a1a1a;
      color: #ffffff;
      outline: none;
      transition: background 0.2s, box-shadow 0.2s;
    }

    .search:focus {
      background: #252525;
      box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.3);
    }

    .search::placeholder {
      color: rgba(255,255,255,0.4);
    }

    /* Song List */
    #list {
      margin-top: 8px;
    }

    .song {
      display: flex;
      align-items: center;
      padding: 12px;
      margin-bottom: 8px;
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      transition: background 0.2s, transform 0.2s;
    }

    .song:active {
      background: rgba(255,255,255,0.06);
      transform: scale(0.98);
    }

    .album-art {
      width: 56px;
      height: 56px;
      min-width: 56px;
      border-radius: 8px;
      background: linear-gradient(135deg, #1db954 0%, #0d5c2f 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .meta {
      flex: 1;
      margin-left: 14px;
      min-width: 0;
    }

    .song-title {
      font-weight: 600;
      font-size: 15px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }

    .song-artist {
      color: rgba(255,255,255,0.6);
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .song-duration {
      color: rgba(255,255,255,0.4);
      font-size: 12px;
      margin-left: 8px;
      white-space: nowrap;
    }

    /* Play Button */
    .play-btn {
      background: #1db954;
      border: none;
      color: #000000;
      padding: 10px 20px;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, background 0.15s;
      margin-left: 8px;
    }

    .play-btn:active {
      transform: scale(0.95);
      background: #1ed760;
    }

    /* Now Playing Bar */
    .now-playing-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(180deg, #1a1a1a 0%, #000000 100%);
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
      z-index: 200;
    }

    .player {
      width: 100%;
      height: 40px;
      border-radius: 4px;
    }

    /* Footer */
    footer {
      padding: 24px 16px;
      text-align: center;
      color: rgba(255,255,255,0.4);
      font-size: 13px;
      line-height: 1.6;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: rgba(255,255,255,0.5);
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    /* Mobile Optimizations */
    @media (max-width: 480px) {
      header {
        padding: 16px;
      }

      .site-title {
        font-size: 20px;
      }

      .manila-time {
        font-size: 18px;
      }

      .container {
        padding: 12px;
      }

      .song {
        padding: 10px;
      }

      .album-art {
        width: 48px;
        height: 48px;
        min-width: 48px;
        font-size: 20px;
      }

      .play-btn {
        padding: 8px 16px;
        font-size: 13px;
      }

      .song-title {
        font-size: 14px;
      }

      .song-artist {
        font-size: 12px;
      }
    }

    /* Smooth scrolling */
    html {
      scroll-behavior: smooth;
    }

    /* Loading animation */
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 48px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(29, 185, 84, 0.2);
      border-top-color: #1db954;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-top">
      <h1 class="site-title">${escapeHtml(title)}</h1>
      <div class="time-container">
        <div class="timezone-label">Manila</div>
        <div class="manila-time" id="manilaTime">--:--</div>
        <div class="manila-date" id="manilaDate">Loading...</div>
      </div>
    </div>
  </header>

  <div class="container">
    <div class="search-wrapper">
      <input id="search" class="search" type="text" placeholder="Search songs or artists..." autocomplete="off" />
    </div>
    <div id="list">
      <div class="loading">
        <div class="loading-spinner"></div>
      </div>
    </div>
  </div>

  <div class="now-playing-bar">
    <audio id="player" class="player" controls preload="metadata"></audio>
  </div>

  <footer>
    Upload songs by forwarding audio to your Telegram bot<br />
    Songs appear automatically in the list
  </footer>

  <script>
    // Manila Timezone (Asia/Manila)
    const MANILA_TZ = 'Asia/Manila';

    function updateManilaTime() {
      const now = new Date();
      
      // Format time
      const timeOptions = { 
        timeZone: MANILA_TZ, 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      };
      const timeStr = now.toLocaleTimeString('en-US', timeOptions);
      
      // Format date
      const dateOptions = { 
        timeZone: MANILA_TZ, 
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
      };
      const dateStr = now.toLocaleDateString('en-US', dateOptions);

      document.getElementById('manilaTime').textContent = timeStr;
      document.getElementById('manilaDate').textContent = dateStr;
    }

    // Update time every second
    updateManilaTime();
    setInterval(updateManilaTime, 1000);

    // Audio player
    const listEl = document.getElementById('list');
    const player = document.getElementById('player');
    const search = document.getElementById('search');

    let songs = [];

    async function load() {
      try {
        const res = await fetch('/song/list');
        const json = await res.json();
        songs = json.songs || [];
        render(songs);
      } catch (err) {
        listEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Failed to load songs</p></div>';
      }
    }

    function render(items) {
      if (items.length === 0) {
        listEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎵</div><p>No songs yet — forward audio to the Telegram bot!</p></div>';
        return;
      }
      
      listEl.innerHTML = '';
      
      for (const s of items) {
        const div = document.createElement('div');
        div.className = 'song';
        
        const duration = s.duration ? formatDuration(s.duration) : '';
        
        div.innerHTML = \`
          <div class="album-art">♪</div>
          <div class="meta">
            <div class="song-title">\${escapeHtmlClient(s.title)}</div>
            <div class="song-artist">\${escapeHtmlClient(s.artist)}\${duration ? ' • ' + duration : ''}</div>
          </div>
          <button class="play-btn" data-id="\${s.id}">Play</button>
        \`;
        
        listEl.appendChild(div);
      }

      // Attach play handlers
      document.querySelectorAll('button.play').forEach(b => {
        b.onclick = () => playId(b.dataset.id);
      });
      
      // Also attach to new play-btn class
      document.querySelectorAll('.play-btn').forEach(b => {
        b.onclick = () => playId(b.dataset.id);
      });
    }

    function playId(id) {
      player.src = \`/stream?id=\${encodeURIComponent(id)}\`;
      player.play().catch(() => {});
    }

    // Search functionality
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      if (!q) {
        render(songs);
        return;
      }
      
      const filtered = songs.filter(s => 
        (s.title || '').toLowerCase().includes(q) || 
        (s.artist || '').toLowerCase().includes(q)
      );
      render(filtered);
    });

    function formatDuration(d) {
      if (!d) return '';
      const m = Math.floor(d / 60);
      const s = d % 60;
      return m + ':' + String(s).padStart(2, '0');
    }

    // Sanitize for client content insertion
    function escapeHtmlClient(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Initial load
    load();
  </script>
</body>
</html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

// ---------- Utilities ----------
function generateId(seed) {
  const t = Date.now().toString(36)
  const s = (seed || Math.random().toString(36)).slice(-6).replace(/[^a-z0-9]/g,'')
  return `${t}-${s}`
}

function jsonResponse(obj) {
  return new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' } })
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}
