// Funtify Music Bot for Cloudflare Workers
// Features:
// - KV as metadata storage (bind as SONGS_KV)
// - /start command to verify bot is working
// - Admin-only file uploads with processing feedback
// - Supports audio, voice, document, video_note, and forwarded files
// - Website name: Funtify
// - Manila time display
// - Mobile compatible

// ============ HARDCODED CONFIGURATION ============
const TELEGRAM_TOKEN = '8484162289:AAHsMAMxppEBYG3naipcfBiIpm0whq3lRBk';
const ADMIN_ID = 8280809263;
const SITE_TITLE = 'Funtify';
const SITE_URL = 'https://funtify.theonej942.workers.dev/'; // Replace with your actual URL

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname.replace(/\/+$/, '') || '/';

      // Telegram Webhook
      if (request.method === 'POST' && pathname === '/webhook') {
        return handleTelegramWebhook(request, env, ctx);
      }

      // Set webhook on /setwebhook route (run once to configure)
      if (pathname === '/setwebhook' && request.method === 'GET') {
        const webhookUrl = url.searchParams.get('url');
        if (!webhookUrl) {
          return new Response('Please provide ?url=YOUR_WEBHOOK_URL\n\nExample: /setwebhook?url=https://your-worker.workers.dev/webhook', { status: 400 });
        }
        const setUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`;
        const res = await fetch(setUrl);
        const json = await res.json();
        return new Response(JSON.stringify(json, null, 2), { headers: { 'Content-Type': 'application/json' } });
      }

      // Delete webhook (for debugging)
      if (pathname === '/deletewebhook' && request.method === 'GET') {
        const delUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteWebhook?drop_pending_updates=true`;
        const res = await fetch(delUrl);
        const json = await res.json();
        return new Response(JSON.stringify(json, null, 2), { headers: { 'Content-Type': 'application/json' } });
      }

      // Get webhook info
      if (pathname === '/webhookinfo' && request.method === 'GET') {
        const infoUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getWebhookInfo`;
        const res = await fetch(infoUrl);
        const json = await res.json();
        return new Response(JSON.stringify(json, null, 2), { headers: { 'Content-Type': 'application/json' } });
      }

      // Home page
      if (request.method === 'GET' && pathname === '/') {
        return serveHomePage(env);
      }

      // List songs
      if (pathname === '/song/list' && request.method === 'GET') {
        return listSongsHandler(env);
      }

      // Add song (admin only via API)
      if (pathname === '/song/add' && request.method === 'POST') {
        return addSongHandler(request, env);
      }

      // Stream audio
      if (pathname === '/stream' && request.method === 'GET') {
        return streamHandler(url.searchParams.get('id'), env);
      }

      return new Response('Not found', { status: 404 });
    } catch (err) {
      return new Response('Server error: ' + err.stack, { status: 500 });
    }
  }
};

// ---------- KV helpers ----------
async function getIndex(env) {
  const raw = await env.SONGS_KV.get('songs:index');
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

async function saveIndex(env, arr) {
  await env.SONGS_KV.put('songs:index', JSON.stringify(arr));
}

async function saveSong(env, song) {
  if (!song.id) throw new Error('song.id required');
  await env.SONGS_KV.put(`song:${song.id}`, JSON.stringify(song));
  const idx = await getIndex(env);
  if (!idx.includes(song.id)) {
    idx.unshift(song.id);
    if (idx.length > 1000) idx.length = 1000;
    await saveIndex(env, idx);
  }
}

async function getSong(env, id) {
  const raw = await env.SONGS_KV.get(`song:${id}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

async function listSongs(env, limit = 200) {
  const idx = await getIndex(env);
  const slice = idx.slice(0, limit);
  const list = await Promise.all(slice.map(id => getSong(env, id)));
  return list.filter(Boolean);
}

// ---------- Telegram API Helpers ----------
async function telegramRequest(method, data) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
}

async function sendMessage(chatId, text, replyToMessageId = null, keyboard = null) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  };
  if (replyToMessageId) payload.reply_to_message_id = replyToMessageId;
  if (keyboard) payload.reply_markup = keyboard;
  return telegramRequest('sendMessage', payload);
}

async function editMessageText(chatId, messageId, text) {
  return telegramRequest('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: 'HTML'
  });
}

async function answerCallbackQuery(callbackQueryId, text) {
  return telegramRequest('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text: text
  });
}

// ---------- Handlers ----------
async function listSongsHandler(env) {
  const songs = await listSongs(env);
  return jsonResponse({ ok: true, count: songs.length, songs });
}

async function addSongHandler(request, env) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('X-API-KEY');
  if (!env.ADMIN_KEY || apiKey !== env.ADMIN_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }
  let body;
  try { body = await request.json(); } catch (e) { return new Response('Bad JSON', { status: 400 }); }
  
  if (!body.title || !body.tg_file_id) {
    return new Response('title and tg_file_id required', { status: 400 });
  }
  
  const id = body.id || generateId(body.tg_file_id);
  const song = {
    id,
    title: body.title,
    artist: body.artist || 'Unknown',
    tg_file_id: body.tg_file_id,
    duration: body.duration || null,
    mime: body.mime || null,
    uploader: body.uploader || 'web',
    created_at: new Date().toISOString(),
  };
  
  await saveSong(env, song);
  return jsonResponse({ ok: true, song });
}

async function streamHandler(id, env) {
  if (!id) return new Response('Missing id', { status: 400 });
  const song = await getSong(env, id);
  if (!song) return new Response('Song not found', { status: 404 });
  if (!song.tg_file_id) return new Response('Song has no tg_file_id', { status: 404 });

  const tgGetFile = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${song.tg_file_id}`;
  const gf = await fetch(tgGetFile);
  const gfJson = await gf.json();
  if (!gfJson.ok) return new Response('Failed to get file from Telegram', { status: 502 });
  
  const file_path = gfJson.result && gfJson.result.file_path;
  if (!file_path) return new Response('Telegram returned no file_path', { status: 502 });

  const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file_path}`;
  const downstream = await fetch(fileUrl);
  if (!downstream.ok) return new Response('Failed to fetch file from Telegram', { status: 502 });
  
  const headers = new Headers(downstream.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Cache-Control', 'public, max-age=300');
  return new Response(downstream.body, { status: downstream.status, headers });
}

// ---------- Main Telegram Webhook Handler ----------
async function handleTelegramWebhook(request, env, ctx) {
  let body;
  try { body = await request.json(); } catch (e) {
    return new Response('Bad JSON', { status: 200 }); // Return 200 to stop retries
  }

  // Handle callback queries
  if (body.callback_query) {
    const callbackQuery = body.callback_query;
    const data = callbackQuery.data;
    const queryId = callbackQuery.id;
    
    // Handle callback data - use ctx.waitUntil
    if (data === 'start') {
      ctx.waitUntil(answerCallbackQuery(queryId, 'Welcome to Funtify! 🎵'));
    }
    
    return new Response('ok', { status: 200 });
  }

  // Handle messages
  const message = body.message || body.edited_message;
  if (!message) {
    return new Response('no message', { status: 200 });
  }

  const chatId = message.chat.id;
  const userId = message.from ? message.from.id : null;
  const text = message.text || '';
  const messageId = message.message_id;

  // Check if user is admin
  const isAdmin = userId === ADMIN_ID;

  // Handle /start command - use ctx.waitUntil
  if (text === '/start') {
    if (isAdmin) {
      const welcomeAdmin = `🎸 <b>Welcome to Funtify Admin Panel!</b>

You're the admin. Send me any audio file and I'll upload it to your website.

<b>Supported:</b>
🎵 Audio files
🎤 Voice messages
📁 Documents (MP3, etc.)
📹 Video notes

I'll reply with processing status.`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🎧 Visit Funtify', url: SITE_URL || 'https://example.com' },
            { text: '📋 View Songs', callback_data: 'list_songs' }
          ]
        ]
      };
      
      ctx.waitUntil(sendMessage(chatId, welcomeAdmin, null, keyboard));
    } else {
      const welcomeUser = `🎵 <b>Welcome to Funtify!</b>

Listen to music online at our website!

<b>Features:</b>
• Stream music anytime
• Search for songs
• Mobile friendly

Click below to visit:`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🎧 Open Funtify', url: SITE_URL || 'https://example.com' }
          ]
        ]
      };
      
      ctx.waitUntil(sendMessage(chatId, welcomeUser, null, keyboard));
    }
    
    return new Response('ok', { status: 200 });
  }

  // Handle /help command
  if (text === '/help') {
    const helpText = isAdmin 
      ? `📋 <b>Admin Help</b>

/start - Show menu
/help - Show this help
Send me audio files to upload

Your Admin ID: ${userId}`
      : `📋 <b>Help</b>

/start - Welcome message
/help - Show this help

Visit Funtify to listen to music!`;
    
    ctx.waitUntil(sendMessage(chatId, helpText, messageId));
    return new Response('ok', { status: 200 });
  }

  // Handle /myid command (for testing)
  if (text === '/myid') {
    ctx.waitUntil(sendMessage(chatId, `Your Telegram ID: <code>${userId}</code>`, messageId));
    return new Response('ok', { status: 200 });
  }

  // Check for audio/document/voice/video_note
  const audio = message.audio || message.voice || message.document || message.video_note || null;
  
  // Also check for forwarded content
  const forwardedFrom = message.forward_from || message.forward_from_chat;
  
  if (!audio && !forwardedFrom) {
    // Not a recognized file type
    if (isAdmin) {
      ctx.waitUntil(sendMessage(chatId, `❓ I don't understand. Send me an audio file, voice message, or document to upload.`, messageId));
    }
    return new Response('ok', { status: 200 });
  }

  // Check admin authorization
  if (!isAdmin) {
    ctx.waitUntil(sendMessage(chatId, `⛔ <b>Unauthorized</b>\n\nOnly the admin can upload songs to Funtify.`, messageId));
    return new Response('ok', { status: 200 });
  }

  // Determine file info
  let fileId = null;
  let fileName = 'Unknown';
  let mimeType = null;
  let duration = null;
  let fileType = 'unknown';

  if (message.audio) {
    fileId = message.audio.file_id;
    fileName = message.audio.file_name || message.audio.title || 'Audio';
    mimeType = message.audio.mime_type;
    duration = message.audio.duration;
    fileType = 'audio';
  } else if (message.voice) {
    fileId = message.voice.file_id;
    fileName = 'Voice Message';
    mimeType = message.voice.mime_type;
    duration = message.voice.duration;
    fileType = 'voice';
  } else if (message.document) {
    fileId = message.document.file_id;
    fileName = message.document.file_name || 'Document';
    mimeType = message.document.mime_type;
    fileType = 'document';
  } else if (message.video_note) {
    fileId = message.video_note.file_id;
    fileName = 'Video Note';
    mimeType = 'video/mp4';
    duration = message.video_note.duration;
    fileType = 'video_note';
  }

  // Validate file
  if (!fileId) {
    ctx.waitUntil(sendMessage(chatId, `❌ Could not get file ID.`, messageId));
    return new Response('ok', { status: 200 });
  }

  // For file uploads, we need to process asynchronously
  // Send processing message first, then handle the rest
  const processingText = `⏳ <b>Processing...</b>\n\n📄 File: ${escapeHtml(fileName)}\n🎵 Type: ${fileType}\n⏱️ Please wait...`;
  
  // Send initial processing message
  const processingMsg = await sendMessage(chatId, processingText, messageId);
  const processingMsgId = processingMsg.result ? processingMsg.result.message_id : null;

  // Process the file upload asynchronously
  ctx.waitUntil(processFileUpload(chatId, messageId, processingMsgId, fileId, fileName, mimeType, duration, fileType, userId, env));

  return new Response('ok', { status: 200 });
}

// Separate async function to handle file upload processing
async function processFileUpload(chatId, messageId, processingMsgId, fileId, fileName, mimeType, duration, fileType, userId, env) {
  try {
    // Generate song ID
    const songId = generateId(fileId);
    
    // Create song metadata
    const song = {
      id: songId,
      title: fileName,
      artist: 'Admin',
      tg_file_id: fileId,
      duration: duration,
      mime: mimeType,
      uploader: String(userId),
      created_at: new Date().toISOString(),
      file_type: fileType
    };

    // Save to KV
    await saveSong(env, song);

    // Format duration
    const durationStr = duration ? formatDuration(duration) : 'Unknown';

    // Success message
    const successText = `✅ <b>Successfully Uploaded!</b>

📄 <b>Title:</b> ${escapeHtml(fileName)}
🎵 <b>Type:</b> ${fileType}
⏱️ <b>Duration:</b> ${durationStr}
🆔 <b>ID:</b> ${songId.slice(0, 12)}...

The song is now available on Funtify!`;

    if (processingMsgId) {
      await editMessageText(chatId, processingMsgId, successText);
    } else {
      await sendMessage(chatId, successText, messageId);
    }

  } catch (error) {
    const errorText = `❌ <b>Error uploading file</b>\n\n${escapeHtml(error.message)}\n\nPlease try again.`;
    
    if (processingMsgId) {
      await editMessageText(chatId, processingMsgId, errorText);
    } else {
      await sendMessage(chatId, errorText, messageId);
    }
  }
}

// ---------- Frontend HTML (Funtify) ----------
function serveHomePage(env) {
  const title = SITE_TITLE;
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
      background: linear-gradient(90deg, #ff6b6b, #ffa500);
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
      box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.3);
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
      background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
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
      background: linear-gradient(135deg, #ff6b6b, #ffa500);
      border: none;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      margin-left: 8px;
    }

    .play-btn:active {
      transform: scale(0.95);
      box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
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
      border: 3px solid rgba(255, 107, 107, 0.2);
      border-top-color: #ff6b6b;
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
    Upload songs by sending audio to Telegram bot<br />
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
        listEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎵</div><p>No songs yet — send audio to the Telegram bot!</p></div>';
        return;
      }
      
      listEl.innerHTML = '';
      
      for (const s of items) {
        const div = document.createElement('div');
        div.className = 'song';
        
        const duration = s.duration ? formatDuration(s.duration) : '';
        
        div.innerHTML = '<div class="album-art">♪</div>' +
          '<div class="meta">' +
            '<div class="song-title">' + escapeHtmlClient(s.title) + '</div>' +
            '<div class="song-artist">' + escapeHtmlClient(s.artist) + (duration ? ' • ' + duration : '') + '</div>' +
          '</div>' +
          '<button class="play-btn" data-id="' + s.id + '">Play</button>';
        
        listEl.appendChild(div);
      }

      // Attach play handlers
      document.querySelectorAll('.play-btn').forEach(b => {
        b.onclick = () => playId(b.dataset.id);
      });
    }

    function playId(id) {
      player.src = '/stream?id=' + encodeURIComponent(id);
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
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ---------- Utilities ----------
function generateId(seed) {
  const t = Date.now().toString(36);
  const s = (seed || Math.random().toString(36)).slice(-6).replace(/[^a-z0-9]/g, '');
  return t + '-' + s;
}

function jsonResponse(obj) {
  return new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' } });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDuration(d) {
  if (!d) return 'Unknown';
  const m = Math.floor(d / 60);
  const s = d % 60;
  return m + ':' + String(s).padStart(2, '0');
}
