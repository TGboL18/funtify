addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

/* CONFIG */
const SITE_TITLE = "LLC Creative Technologies"
const LOGO_URL = "https://image2url.com/r2/default/gifs/1771931447321-b9c0bd19-ff5c-4d39-8d0a-06b9ab79821e.gif"
const AUDIO_URL = "https://image2url.com/r2/default/audio/1771931706652-c6c30957-9354-46ef-869b-339a6e020cf6.mp3"
// invite for The Hub (hidden)
const THE_HUB_INVITE = "https://t.me/+7AcFN8RMcnc5N2U1"
// anonychat invite (hidden)
const ANONYCHAT_INVITE = "https://t.me/anonychatllc_bot/anonychatllc"
// audio to play before redirect (the M4A you provided)
const ANONYCHAT_AUDIO_URL = "https://image2url.com/r2/default/audio/1772026713893-31ad5447-91c0-4842-8c51-b03c2331cf60.m4a"
// Globan bot link
const GLOBAN_BOT_URL = "https://t.me/globanllcbot_bot"
// Bot token for hash verification
const BOT_TOKEN = "8574986440:AAHbNgV5aYgfVaXcuvxUVB2oZcrut6LbSeg"
// Webhook for appeals
const APPEAL_WEBHOOK_URL = "https://your-worker.subdomain.workers.dev/webhook/appeal"
const APPEAL_WEBHOOK_SECRET = "globan192026"
const KV_KEY = "views"
/* end config */

let fallbackViews = 0

// Registered groups for globan dashboard
const REGISTERED_GROUPS = [
  "⌜💘⌟ 𝓐𝓯𝓪𝓶𝐇𝐔𝐍𝐓𝐄𝐑𝐙",
  "⌜⌟ 𝐓𝐀𝐌🫟𝐃𝓮𝓻𝓸 ᴘʀᴇᴍɪᴜᴍ",
  "⌜️🏆⌟ 𝐕𝐀𝐑𝐒𝐈𝐓𝐘 ᴘʜ",
  "[ 𝗧𝗔𝗠𝗕𝗔𝗬𝗔𝗡 𝗡𝗚 𝗠𝗚𝗔 𝗕𝗔𝗗𝗜𝗡𝗚 ]",
  "𝐂𝐚𝐦𝐩𝐮𝐬 𝐨𝐟 𝐆𝐨𝐝𝐝𝐞𝐬𝐬",
  "🅦 𝙷𝙸𝙳𝙴𝙾𝚄𝚃",
  "🇹𝖍𝖊 🇭✧🇴✧🇰",
  "𝕱𝖀𝕭𝖀 | 𝐅𝐮𝐧 𝐁𝐮𝐝𝐝𝐲",
  "𝐍𝐀𝐍𝐍𝐎'𝐒 𝐒𝐀𝐍𝐂𝐓𝐔𝐀𝐑𝐘",
  "𝑯𝑶𝑹𝑵𝒀 𝑪𝑰𝑻𝒀",
  "『 𝐂𝐇𝐀𝐓 𝐍' 𝐂𝐇𝐈𝐋𝐋 』",
  "『 𝗞𝗔𝗟𝗔𝗧 𝗚𝗔𝗟𝗟𝗘𝗥𝗜𝗔 』",
  "𝙎𝙖𝙣𝙜'𝙜𝙧𝙚 𝙇𝙪𝙭𝙚 𝙎𝙤𝙘𝙞𝙚𝙩𝙮🦋",
  "☬Ë™️|☞Escape The Mercy☜",
  "⌜⌟ 𝐓𝐀𝐌🫟𝐃𝓮𝓻𝓸 ғʀᴇᴍɪᴜᴍ",
  "《◇TROPAPIP'Z 8.O◇》",
  "Music jam",
  "『 𝗦𝗔𝗡𝗚𝗚𝗨𝗡𝗜𝗔𝗡𝗚 𝗞𝗔𝗟𝗜𝗕𝗨𝗚𝗔𝗡 』",
  "『 𝑻𝒉𝒆 𝑨𝒓𝒄𝒉𝒊𝒗𝒆𝒔 』",
  "Pinoy Bi Hub"
]

async function getAndIncrementViews() {
  try {
    if (typeof VIEWS_KV !== "undefined" && VIEWS_KV !== null) {
      const cur = await VIEWS_KV.get(KV_KEY)
      const n = cur ? parseInt(cur, 10) : 0
      const next = n + 1
      await VIEWS_KV.put(KV_KEY, String(next))
      return next
    }
  } catch (e) {
    // KV not available -> fallback
  }
  fallbackViews = fallbackViews + 1
  return fallbackViews
}

async function handleRequest(request) {
  // Handle webhook endpoint for appeals
  if (request.url.includes("/webhook/appeal")) {
    return handleAppealWebhook(request)
  }
  
  // Handle Telegram Login Widget authentication callback
  if (request.url.includes("/webhook/auth")) {
    return handleTelegramAuth(request)
  }
  
  if (request.method !== "GET") return new Response(null, { status: 405 })

  const views = await getAndIncrementViews()

  const groupsHtml = REGISTERED_GROUPS.map(group => 
    `<div class="group-item">${escapeHtml(group)}</div>`
  ).join('')

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<title>${escapeHtml(SITE_TITLE)}</title>
<meta name="theme-color" content="#000000" />
<meta name="referrer" content="no-referrer" />
<script async src="https://telegram.org/js/telegram-widget.js?22"
        data-telegram-login="@globanllcbot_bot"
        data-size="large"
        data-onauth="onTelegramAuth(user)"
        data-request-access="write">
</script>
<script type="text/javascript">
  function onTelegramAuth(user) {
    // Store user data
    const userData = {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name || '',
      username: user.username || '',
      photo_url: user.photo_url || ''
    };
    localStorage.setItem('telegram_user', JSON.stringify(userData));
    
    // Show success message
    alert('Logged in as ' + user.first_name + ' ' + (user.last_name || '') + ' (' + user.id + (user.username ? ', @' + user.username : '') + ')');
    
    // Redirect to appeal if needed
    const params = new URLSearchParams(window.location.search);
    if (params.get('continue_to_appeal') === 'true') {
      window.location.href = '/';
    }
  }
</script>
<style>
  :root{ --bg:#000; --fg:#fff; --muted:rgba(255,255,255,0.8); --gray:#9aa0a6; --accent:#ff1f1f; --accent2:#a855f7; }
  * { box-sizing: border-box; }
  html,body{height:100%;margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,Arial,sans-serif;-webkit-font-smoothing:antialiased;}
  .wrap { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; box-sizing:border-box; text-align:center; position:relative; overflow:hidden; }
  img.logo{ width:280px; max-width:78%; height:auto; display:block; border:0; margin:0 auto; }
  .title{ margin-top:12px; font-weight:700; font-size:20px; letter-spacing:0.6px; }
  .meta{ margin-top:6px; font-size:13px; color:var(--muted); }

  .sections{ margin-top:18px; display:flex; flex-direction:column; gap:18px; align-items:center; width:100%; }
  .section{ width:100%; max-width:420px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:8px; }
  .section h3{ margin:0; font-size:14px; color:var(--muted); text-transform:lowercase; letter-spacing:0.6px; }
  .list{ width:100%; background:rgba(255,255,255,0.02); padding:10px 12px; border-radius:10px; display:flex; flex-direction:column; gap:8px; align-items:center; }
  .link{ color:var(--fg); text-decoration:none; font-weight:700; font-size:15px; display:inline-block; text-align:center; width:100%; max-width:320px; padding:6px 8px; }

  .bot1{ background:linear-gradient(270deg,#ffffff,#ff1f1f,#ffffff); background-size:600% 600%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:slide 4s linear infinite; text-shadow:0 0 6px rgba(255,30,30,0.8); }
  .bot2{ background:linear-gradient(270deg,#a855f7,#3b82f6,#fb7185,#a855f7); background-size:600% 600%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:slide 5s linear infinite; }
  @keyframes slide{0%{background-position:100% 50%}100%{background-position:0% 50%}}

  .thehub{ font-weight:800; font-size:18px; display:inline-block; padding:8px 12px; border-radius:999px; cursor:pointer; animation:floatY 3.6s ease-in-out infinite; text-align:center; }
  @keyframes floatY {0%{transform:translateY(0px)}50%{transform:translateY(-10px)}100%{transform:translateY(0px)}}
  .gc-glow{ background:linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,0,0,0.85)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:glowShift 2.4s linear infinite; text-shadow:0 0 30px rgba(255,80,80,0.9),0 0 60px rgba(255,60,60,0.6); }
  @keyframes glowShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

  .anony { font-weight:800; font-size:18px; cursor:pointer; display:inline-block; padding:8px 12px; border-radius:8px; color:var(--fg); animation:jump 1.2s ease-in-out infinite; }
  @keyframes jump { 0%{transform:translateY(0)}25%{transform:translateY(-8px)}50%{transform:translateY(0)}75%{transform:translateY(-4px)}100%{transform:translateY(0)} }

  .other-site{ font-weight:800; font-size:18px; cursor:pointer; color:var(--fg); display:inline-block; padding:8px 12px; border-radius:8px; text-align:center; }

  .modal { position:fixed; left:50%; top:50%; transform:translate(-50%,-50%) scale(0.96); background:rgba(10,10,10,0.96); color:#fff; padding:18px 22px; border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,0.6); opacity:0; pointer-events:none; transition: opacity 350ms ease, transform 350ms ease; z-index:2000; text-align:center; }
  .modal.show { opacity:1; pointer-events:auto; transform:translate(-50%,-50%) scale(1); }
  .modal.hide { opacity:0; pointer-events:none; transform:translate(-50%,-50%) scale(0.96); }

  .fade-overlay { position:fixed; inset:0; background:#000; opacity:0; pointer-events:none; transition: opacity 900ms ease; z-index:3000; }
  .fade-overlay.visible { opacity:1; pointer-events:auto; }

  .rainer{ pointer-events:none; position:fixed; inset:0; overflow:hidden; z-index:999; }
  .th{ position:absolute; top:-10%; left:0; font-weight:800; color:rgba(255,255,255,0.95); text-shadow:0 2px 8px rgba(0,0,0,0.6); animation:fall linear forwards; user-select:none; -webkit-user-select:none; }
  @keyframes fall{ to{ transform:translateY(120vh) rotate(720deg); opacity:0 } }

  .info-row{ position:fixed; left:0; right:0; bottom:38px; display:flex; justify-content:space-between; align-items:center; padding:0 18px; box-sizing:border-box; font-size:13px; color:var(--muted); max-width:1100px; margin:0 auto; }
  .pill{ background: rgba(255,255,255,0.02); padding:8px 12px; border-radius:999px; }
  .footer{ position:fixed; bottom:10px; font-size:12px; opacity:0.6; width:100%; text-align:center; left:0; }

  .landscape-overlay { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.92); color:#fff; font-size:30px; font-weight:900; text-align:center; z-index:4000; opacity:0; pointer-events:none; transition: opacity 200ms ease; }
  .landscape-overlay.show { opacity:1; pointer-events:auto; }

  /* Dashboard Styles */
  .dashboard-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.97); z-index:5000; display:none; flex-direction:column; align-items:center; justify-content:center; padding:20px; box-sizing:border-box; overflow-y:auto; }
  .dashboard-overlay.active { display:flex; }
  
  .dashboard-close { position:absolute; top:20px; right:20px; background:rgba(255,255,255,0.1); border:none; color:#fff; font-size:24px; width:40px; height:40px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .dashboard-close:hover { background:rgba(255,255,255,0.2); }
  
  .dashboard-logo { width:180px; max-width:60%; height:auto; margin-bottom:15px; }
  .dashboard-title { font-size:26px; font-weight:800; margin-bottom:6px; background:linear-gradient(90deg, #ff1f1f, #ffffff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .dashboard-subtitle { font-size:13px; color:var(--muted); margin-bottom:20px; }
  
  .dashboard-groups { width:100%; max-width:420px; max-height:25vh; overflow-y:auto; background:rgba(255,255,255,0.03); border-radius:16px; padding:12px; display:flex; flex-direction:column; gap:6px; margin-bottom:20px; }
  .dashboard-groups::-webkit-scrollbar { width:6px; }
  .dashboard-groups::-webkit-scrollbar-track { background:rgba(255,255,255,0.05); border-radius:3px; }
  .dashboard-groups::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.2); border-radius:3px; }
  
  .group-item { background:rgba(255,255,255,0.06); padding:10px 12px; border-radius:8px; font-size:12px; font-weight:600; text-align:left; word-break:break-word; }

  .dashboard-form { width:100%; max-width:420px; display:flex; flex-direction:column; gap:12px; margin-bottom:15px; }
  .form-group { text-align:left; }
  .form-label { display:block; font-size:12px; color:var(--muted); margin-bottom:6px; font-weight:600; }
  .form-input { width:100%; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:12px 15px; color:#fff; font-size:14px; font-family:inherit; outline:none; transition: border-color 0.2s, background 0.2s; }
  .form-input:focus { border-color:var(--accent); background:rgba(255,255,255,0.12); }
  .form-input::placeholder { color:rgba(255,255,255,0.4); }
  textarea.form-input { resize:vertical; min-height:80px; }
  
  .dashboard-btn { background:linear-gradient(135deg, #ff1f1f, #ff5050); color:#fff; font-weight:800; font-size:14px; padding:12px 24px; border:none; border-radius:50px; cursor:pointer; text-decoration:none; display:inline-block; transition: transform 0.2s, box-shadow 0.2s; box-shadow:0 4px 20px rgba(255,31,31,0.4); margin:4px; }
  .dashboard-btn:hover { transform:scale(1.03); box-shadow:0 6px 30px rgba(255,31,31,0.6); }
  .dashboard-btn:active { transform:scale(0.98); }
  .dashboard-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
  
  .dashboard-btn-secondary { background:rgba(255,255,255,0.1); color:#fff; font-weight:700; }
  .dashboard-btn-secondary:hover { background:rgba(255,255,255,0.15); box-shadow:none; }

  .user-info { display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.05); padding:10px 14px; border-radius:10px; margin-bottom:10px; }
  .user-avatar { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg, var(--accent), var(--accent2)); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; }
  .user-details { flex:1; text-align:left; }
  .user-name { font-weight:700; font-size:14px; }
  .user-id { font-size:11px; color:var(--muted); }

  .success-message { background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.3); color:#22c55e; padding:12px 16px; border-radius:10px; font-size:13px; margin-top:10px; }
  .error-message { background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#ef4444; padding:12px 16px; border-radius:10px; font-size:13px; margin-top:10px; }

  .button-row { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }

  @media(min-width:520px){ img.logo{ width:320px } }
</style>
</head>
<body>
  <main class="wrap" role="main" aria-label="${escapeHtml(SITE_TITLE)}">
    <img id="logo" class="logo" src="${escapeHtml(LOGO_URL)}" alt="${escapeHtml(SITE_TITLE)} logo">
    <div class="title">${escapeHtml(SITE_TITLE)}</div>
    <div class="meta">We create Tech</div>

    <div class="sections" aria-hidden="false">
      <div class="section">
        <h3>our bots</h3>
        <div class="list">
          <a id="globanBot" class="link bot1" href="javascript:void(0)" rel="noopener noreferrer">@globanllcbot_bot</a>
          <a class="link bot2" href="https://t.me/funmatchjrllc_bot" target="_blank" rel="noopener noreferrer">@funmatchjrllc_bot</a>
        </div>
      </div>

      <div class="section">
        <h3>our gc's</h3>
        <div class="list">
          <a id="theHub" class="link thehub gc-glow" href="${escapeHtml(THE_HUB_INVITE)}" target="_blank" rel="noopener noreferrer">The Hub</a>
        </div>
      </div>

      <div class="section">
        <h3>our Other website</h3>
        <div class="list">
          <span id="funtify" class="other-site" tabindex="0">funtify</span>
          <span id="anonychat" class="anony" tabindex="0">anonychat</span>
        </div>
      </div>
    </div>

    <div id="rainer" class="rainer" aria-hidden="true"></div>

    <div id="modal" class="modal hide" role="dialog" aria-modal="true" aria-hidden="true">Currently not available</div>
    <div id="fadeOverlay" class="fade-overlay" aria-hidden="true"></div>
    <div id="landOverlay" class="landscape-overlay" aria-hidden="true">no fucking landscape!</div>
  </main>

  <!-- Globan Dashboard -->
  <div id="dashboardOverlay" class="dashboard-overlay">
    <button id="closeDashboard" class="dashboard-close">&times;</button>
    <img class="dashboard-logo" src="${escapeHtml(LOGO_URL)}" alt="Logo">
    <div class="dashboard-title">GLOBAN</div>
    <div class="dashboard-subtitle">Registered Groups</div>
    
    <div class="dashboard-groups">
      ${groupsHtml}
    </div>
    
    <div class="user-info" id="userInfo" style="display:none;">
      <div class="user-avatar" id="userAvatar">?</div>
      <div class="user-details">
        <div class="user-name" id="userName">Loading...</div>
        <div class="user-id" id="userId">ID: ...</div>
      </div>
    </div>
    
    <!-- Telegram Login Widget Container -->
    <div id="telegramLoginContainer" class="dashboard-form" style="display:none; text-align:center;">
      <p style="color:rgba(255,255,255,0.7); margin-bottom:15px; font-size:13px;">Please login with Telegram to submit an appeal</p>
      <script async src="https://telegram.org/js/telegram-widget.js?22"
        data-telegram-login="@globanllcbot_bot"
        data-size="large"
        data-onauth="onTelegramAuth(user)"
        data-request-access="write">
      </script>
    </div>
    
    <form class="dashboard-form" id="appealForm" style="display:none;">
      <div class="form-group">
        <label class="form-label">Your Appeal Message</label>
        <textarea class="form-input" id="appealMessage" placeholder="Explain your situation and why you should be unbanned..." required></textarea>
      </div>
      <button type="submit" class="dashboard-btn" id="submitAppeal">Submit Appeal</button>
    </form>
    
    <div id="formMessage"></div>
    
    <div class="button-row">
      <a id="continueToBot" class="dashboard-btn dashboard-btn-secondary" href="${escapeHtml(GLOBAN_BOT_URL)}" target="_blank" rel="noopener noreferrer">Continue to Bot</a>
      <button id="showAppealBtn" class="dashboard-btn">Submit Appeal</button>
    </div>
  </div>

  <div class="info-row" aria-hidden="false">
    <div class="pill" id="timeBox">${new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila", hour12:true, year:'numeric', month:'long', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' })}</div>
    <div class="pill">👁 ${views}</div>
  </div>

  <div class="footer">Powered by L © 2026 LLC Tech Corporation</div>

  <!-- background audio (loops) -->
  <audio id="bgAudio" autoplay loop playsinline preload="auto" crossorigin="anonymous">
    <source src="${escapeHtml(AUDIO_URL)}" type="audio/mpeg">
  </audio>

<script>
  // Check for Telegram auth data in URL on page load
  (function() {
    const params = new URLSearchParams(window.location.search)
    const telegramAuth = params.get('telegram_auth')
    const continueToAppeal = params.get('continue_to_appeal')
    
    if (telegramAuth) {
      try {
        const userData = JSON.parse(atob(telegramAuth))
        // Store user data in localStorage for persistence
        localStorage.setItem('telegram_user', JSON.stringify(userData))
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname)
        
        // If redirected from auth with continue_to_appeal, open dashboard and show appeal form
        if (continueToAppeal === 'true') {
          // Wait a bit for the page to fully load
          setTimeout(() => {
            openDashboard()
            // Show appeal form directly
            const isLoggedIn = detectUserInfo()
            if (isLoggedIn) {
              appealForm.style.display = 'flex'
              telegramLoginContainer.style.display = 'none'
              showAppealBtn.style.display = 'none'
            }
          }, 500)
        }
      } catch (e) {
        console.error('Failed to parse Telegram auth data:', e)
      }
    }
  })();
  
  // Prevent back button and history manipulation
  (function() {
    history.replaceState(null, document.title, location.href);
    history.pushState(null, document.title, location.href);
    
    window.addEventListener('popstate', function(event) {
      history.pushState(null, document.title, location.href);
    });
    
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    });
    
    document.addEventListener('selectstart', function(e) {
      e.preventDefault();
      return false;
    });
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  })();

  // helper: update Manila time
  function updateTimeDisplay() {
    const opts = { timeZone: 'Asia/Manila', hour12: true, year:'numeric', month:'long', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' };
    document.getElementById('timeBox').textContent = new Date().toLocaleString('en-PH', opts);
  }
  setInterval(updateTimeDisplay,1000);
  updateTimeDisplay();

  // background audio autoplay best-effort
  const audio = document.getElementById('bgAudio');
  async function tryPlay() {
    try { audio.muted = false; await audio.play(); return true; }
    catch (e) { return false; }
  }
  window.addEventListener('load', async () => {
    const ok = await tryPlay();
    if (!ok) {
      function startOnGesture() { audio.play().catch(()=>{}); removeListeners(); }
      function removeListeners() {
        document.removeEventListener('pointerdown', startOnGesture);
        document.removeEventListener('touchstart', startOnGesture);
        document.removeEventListener('click', startOnGesture);
      }
      document.addEventListener('pointerdown', startOnGesture, { once:true, passive:true });
      document.addEventListener('touchstart', startOnGesture, { once:true, passive:true });
      document.addEventListener('click', startOnGesture, { once:true, passive:true });
    }
  });

  // The Hub behaviour: float + glow + rain
  const theHub = document.getElementById('theHub');
  const rainer = document.getElementById('rainer');
  function createTH() {
    const el = document.createElement('div');
    el.className = 'th';
    el.textContent = 'TH';
    const startX = Math.random() * 100;
    el.style.left = startX + 'vw';
    const size = 18 + Math.random() * 36;
    el.style.fontSize = size + 'px';
    const rot = Math.random() * 360;
    el.style.transform = 'rotate(' + rot + 'deg)';
    const duration = 3500 + Math.random() * 3200;
    el.style.animationDuration = duration + 'ms';
    el.style.color = 'rgba(255,255,255,' + (0.9 - Math.random()*0.4) + ')';
    rainer.appendChild(el);
    el.addEventListener('animationend', ()=> el.remove());
  }
  function hubClicked(e) {
    theHub.classList.add('gc-active');
    const bursts = 120;
    const burstInterval = 25;
    let spawned = 0;
    const iv = setInterval(()=> {
      createTH(); spawned++;
      if (spawned >= bursts) { clearInterval(iv); setTimeout(()=> theHub.classList.remove('gc-active'),1700); }
    }, burstInterval);
    theHub.style.pointerEvents='none';
    setTimeout(()=> theHub.style.pointerEvents='',2500);
  }
  theHub.addEventListener('click', hubClicked, { passive:true });

  // funtify popup
  const funtify = document.getElementById('funtify');
  const modal = document.getElementById('modal');
  function showModal(msg, duration=1800) {
    modal.textContent = msg;
    modal.classList.remove('hide'); modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    setTimeout(()=> {
      modal.classList.remove('show'); modal.classList.add('hide');
      modal.setAttribute('aria-hidden','true');
    }, duration);
  }
  funtify.addEventListener('click', (e) => { e.preventDefault(); showModal('Currently not available', 1800); }, { passive:false });
  funtify.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); showModal('Currently not available', 1800); } });

  // ANONYCHAT behaviour: play provided M4A, fade overlay when sound plays, redirect when sound ends
  const anony = document.getElementById('anonychat');
  const fadeOverlay = document.getElementById('fadeOverlay');

  function startAnonySequence() {
    anony.style.pointerEvents = 'none';
    try { audio.pause(); } catch(e) {}

    const redirectAudio = new Audio(${JSON.stringify(ANONYCHAT_AUDIO_URL)});
    redirectAudio.preload = 'auto';
    redirectAudio.addEventListener('playing', () => {
      fadeOverlay.classList.add('visible');
      fadeOverlay.setAttribute('aria-hidden','false');
    }, { once: true });

    redirectAudio.addEventListener('ended', () => {
      try { window.location.href = ${JSON.stringify(ANONYCHAT_INVITE)}; } catch (e) { }
    }, { once: true });

    redirectAudio.addEventListener('loadedmetadata', () => {
      const dur = redirectAudio.duration && isFinite(redirectAudio.duration) ? (redirectAudio.duration * 1000) + 1200 : 8000;
      setTimeout(() => {
        try { window.location.href = ${JSON.stringify(ANONYCHAT_INVITE)}; } catch(e){}
      }, dur);
    }, { once: true });

    redirectAudio.play().catch((err) => {
      fadeOverlay.classList.add('visible');
      fadeOverlay.setAttribute('aria-hidden','false');
      setTimeout(()=> { try { window.location.href = ${JSON.stringify(ANONYCHAT_INVITE)}; } catch(e){} }, 950);
    });
  }

  anony.addEventListener('click', (e) => {
    e.preventDefault();
    startAnonySequence();
  }, { passive:false });

  anony.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); startAnonySequence(); }
  });

  // landscape detection overlay
  const landOverlay = document.getElementById('landOverlay');
  function checkLandscape() {
    const isLandscape = (window.innerWidth > window.innerHeight);
    if (isLandscape) {
      landOverlay.classList.add('show');
      landOverlay.setAttribute('aria-hidden','false');
    } else {
      landOverlay.classList.remove('show');
      landOverlay.setAttribute('aria-hidden','true');
    }
  }
  window.addEventListener('load', checkLandscape);
  window.addEventListener('resize', checkLandscape);
  window.addEventListener('orientationchange', () => { setTimeout(checkLandscape, 120); });

  landOverlay.addEventListener('click', () => {
    landOverlay.classList.remove('show');
    landOverlay.setAttribute('aria-hidden','true');
  });

  // logo toggles background audio
  const logo = document.getElementById('logo');
  logo.addEventListener('click', () => {
    if (audio.paused) audio.play().catch(()=>{});
    else audio.pause();
  }, { passive:true });

  // close modal on Escape
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { 
      modal.classList.remove('show'); 
      modal.classList.add('hide'); 
      modal.setAttribute('aria-hidden','true');
      closeDashboard();
    }
  });

  // ========== Globan Dashboard Functionality ==========
  const globanBot = document.getElementById('globanBot');
  const dashboardOverlay = document.getElementById('dashboardOverlay');
  const closeDashboardBtn = document.getElementById('closeDashboard');
  const appealForm = document.getElementById('appealForm');
  const formMessage = document.getElementById('formMessage');
  const submitBtn = document.getElementById('submitAppeal');
  const showAppealBtn = document.getElementById('showAppealBtn');
  const continueToBot = document.getElementById('continueToBot');
  const userInfoEl = document.getElementById('userInfo');
  
  // Auto-detect user info from Telegram Login Widget (via localStorage)
  let userData = {
    user_id: '',
    username: '',
    first_name: ''
  };

  function detectUserInfo() {
    // Try to get info from localStorage (set after Telegram login)
    const stored = localStorage.getItem('telegram_user')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        userData = {
          user_id: String(parsed.user_id || ''),
          username: parsed.username || '',
          first_name: parsed.first_name || 'User'
        }
      } catch (e) {
        console.error('Failed to parse stored user data:', e)
      }
    }
    
    // Update UI if user data is available
    if (userData.user_id) {
      const userNameEl = document.getElementById('userName')
      const userIdEl = document.getElementById('userId')
      const userAvatarEl = document.getElementById('userAvatar')
      
      userNameEl.textContent = userData.first_name + (userData.username ? ' (@' + userData.username + ')' : '')
      userIdEl.textContent = 'ID: ' + userData.user_id
      userAvatarEl.textContent = userData.first_name.charAt(0).toUpperCase()
      
      userInfoEl.style.display = 'flex'
      return true
    }
    return false
  }

  function openDashboard() {
    try { audio.pause(); } catch(e) {}
    dashboardOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    history.pushState({dashboard: true}, document.title, location.href);
    
    // Reset to initial state
    appealForm.style.display = 'none';
    telegramLoginContainer.style.display = 'none';
    formMessage.innerHTML = '';
    showAppealBtn.textContent = 'Submit Appeal';
    showAppealBtn.style.display = 'inline-block';
    
    // Auto-detect user info
    detectUserInfo();
  }

  function closeDashboard() {
    try { audio.play(); } catch(e) {}
    dashboardOverlay.classList.remove('active');
    document.body.style.overflow = '';
    history.replaceState({dashboard: false}, document.title, location.href);
    
    // Reset form
    appealForm.reset();
    appealForm.style.display = 'none';
    telegramLoginContainer.style.display = 'none';
    formMessage.innerHTML = '';
    showAppealBtn.style.display = 'inline-block';
  }

  globanBot.addEventListener('click', (e) => {
    e.preventDefault();
    openDashboard();
  }, { passive:false });

  globanBot.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') { 
      ev.preventDefault(); 
      openDashboard(); 
    }
  });

  closeDashboardBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeDashboard();
  }, { passive:false });

  window.addEventListener('popstate', function(event) {
    if (dashboardOverlay.classList.contains('active')) {
      closeDashboard();
      history.pushState({dashboard: false}, document.title, location.href);
    }
  });

  // Show appeal form
  const telegramLoginContainer = document.getElementById('telegramLoginContainer')
  
  showAppealBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showAppealBtn.style.display = 'none';
    
    // Check if user is already logged in
    const isLoggedIn = detectUserInfo()
    
    if (isLoggedIn) {
      // User is logged in, show the appeal form
      appealForm.style.display = 'flex'
    } else {
      // User is not logged in, show Telegram login widget
      telegramLoginContainer.style.display = 'block'
    }
  });

  // Continue to bot button
  continueToBot.addEventListener('click', () => {
    setTimeout(() => {
      closeDashboard();
    }, 100);
  });

  // Handle form submission
  appealForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const appealMessage = document.getElementById('appealMessage').value.trim();
    
    if (!appealMessage) {
      formMessage.innerHTML = '<div class="error-message">Please enter your appeal message</div>';
      return;
    }
    
    // Check if user info is available
    if (!userData.user_id) {
      formMessage.innerHTML = '<div class="error-message">Please login with Telegram to submit an appeal.</div>';
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    formMessage.innerHTML = '';
    
    const appealData = {
      user_id: userData.user_id,
      username: userData.username,
      first_name: userData.first_name,
      appeal_message: appealMessage,
      timestamp: new Date().toISOString()
    };
    
    try {
      const response = await fetch(${JSON.stringify(APPEAL_WEBHOOK_URL)}, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${APPEAL_WEBHOOK_SECRET}'
        },
        body: JSON.stringify(appealData)
      });
      
      if (response.ok) {
        formMessage.innerHTML = '<div class="success-message">Appeal submitted successfully! The administrators will review your case.</div>';
        submitBtn.textContent = 'Submitted!';
        setTimeout(() => {
          closeDashboard();
        }, 2000);
      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      formMessage.innerHTML = '<div class="error-message">Failed to submit appeal. Please try again or contact support directly.</div>';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Appeal';
    }
  });
<\/script>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, private, max-age=0"
    }
  })
}

// Handle appeal webhook
async function handleAppealWebhook(request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const token = authHeader.replace('Bearer ', '')
    if (token !== APPEAL_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Parse the appeal data
    const appealData = await request.json()
    
    // Validate required fields
    if (!appealData.user_id || !appealData.appeal_message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Process the appeal (you can customize this)
    // For now, just log it - you can add database storage or forward to Telegram
    console.log('New Appeal Received:', JSON.stringify(appealData, null, 2))
    
    // Here you can add:
    // - Save to KV/Database
    // - Send to Telegram admin bot
    // - Send confirmation to user
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Appeal received',
      appeal_id: Date.now()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Handle Telegram Login Widget authentication
async function handleTelegramAuth(request) {
  try {
    // Check if it's a POST request (Telegram Widget sends form data)
    if (request.method === "POST") {
      const formData = await request.formData()
      const data = {}
      for (const [key, value] of formData.entries()) {
        data[key] = value
      }
      
      return await processTelegramAuthData(data)
    }
    
    // Check if it's a GET request (redirect mode)
    const url = new URL(request.url)
    const params = url.searchParams
    
    // Get user data from query params
    const id = params.get('id')
    const first_name = params.get('first_name')
    const last_name = params.get('last_name')
    const username = params.get('username')
    const photo_url = params.get('photo_url')
    const auth_date = params.get('auth_date')
    const hash = params.get('hash')
    
    const data = {
      id: id,
      first_name: first_name,
      last_name: last_name,
      username: username,
      photo_url: photo_url,
      auth_date: auth_date,
      hash: hash
    }
    
    return await processTelegramAuthData(data)
    
  } catch (error) {
    console.error('Telegram Auth Error:', error)
    return showCrossLineMessage()
  }
}

// Process Telegram auth data and verify hash
async function processTelegramAuthData(data) {
  // Check if we have valid user data
  if (!data.id) {
    // No user data - not from Telegram
    return showCrossLineMessage()
  }
  
  // Verify the hash if we have a bot token
  if (BOT_TOKEN && BOT_TOKEN !== "YOUR_BOT_TOKEN_HERE") {
    const isValid = await verifyTelegramHash(data, BOT_TOKEN)
    if (!isValid) {
      console.error('Invalid Telegram hash')
      return showCrossLineMessage()
    }
  }
  
  // User IS from Telegram - capture the username and ID, continue to appeal
  const userData = {
    user_id: data.id,
    first_name: data.first_name,
    last_name: data.last_name,
    username: data.username,
    photo_url: data.photo_url,
    auth_date: data.auth_date
  }
  
  console.log('Telegram Auth Success:', JSON.stringify({
    user_id: data.id,
    username: data.username,
    first_name: data.first_name
  }))
  
  // Redirect back to main page with user data encoded in URL to continue to appeal
  const encodedUserData = encodeURIComponent(btoa(JSON.stringify(userData)))
  
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/?telegram_auth=' + encodedUserData + '&continue_to_appeal=true'
    }
  })
}

// Verify Telegram Login Widget hash
async function verifyTelegramHash(data, botToken) {
  try {
    // Create secret key from bot token
    const secretKey = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(botToken)
    )
    
    // Create data check string (sort keys, exclude hash)
    const checkString = Object.keys(data)
      .filter(key => key !== 'hash')
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('\n')
    
    // Create HMAC
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      secretKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      hmacKey,
      new TextEncoder().encode(checkString)
    )
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signature))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return hashHex === data.hash
  } catch (error) {
    console.error('Hash verification error:', error)
    // If verification fails, still allow (for testing purposes)
    return true
  }
}

// Show "ohh you cross the line bro" message
function showCrossLineMessage() {
  const crossLineHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Access Denied</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { 
      height: 100%; 
      background: #000; 
      color: #fff; 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .container {
      text-align: center;
      padding: 20px;
      animation: fadeIn 0.5s ease;
    }
    .message {
      font-size: 28px;
      font-weight: 800;
      color: #ff1f1f;
      text-shadow: 0 0 20px rgba(255, 31, 31, 0.8);
      margin-bottom: 20px;
      animation: pulse 1.5s ease-in-out infinite;
    }
    .sub-message {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 30px;
    }
    .redirect-msg {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="message">ohh you cross the line bro</div>
    <div class="sub-message">You need to access this from Telegram</div>
    <div class="redirect-msg">Redirecting to main website...</div>
  </div>
  <script>
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);
  </script>
</body>
</html>`
  
  return new Response(crossLineHtml, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8"
    }
  })
}

/* small helper */
function escapeHtml (str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
