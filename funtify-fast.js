// Funtify - Cloudflare Workers - Optimized for Fast Loading
// Features: Fast pagination, Singers tab, Live Chat, Mobile optimized

const HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#0a0a1a">
    <title>Funtify</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root { --bg: #0a0a1a; --bg2: #12122a; --bg3: #1e1e3f; --accent: #3b82f6; --text: #fff; --text2: #94a3b8; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }

        /* Loading */
        .loading { position: fixed; inset: 0; background: var(--bg); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999; transition: opacity 0.3s; }
        .loading.hidden { opacity: 0; pointer-events: none; }
        .spinner { width: 50px; height: 50px; border: 4px solid var(--bg3); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { margin-top: 16px; color: var(--accent); font-size: 16px; }
        .loading-sub { font-size: 12px; color: var(--text2); margin-top: 8px; }

        /* Header */
        .header { background: #000; padding: 12px 16px; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid var(--bg3); }
        .header-row { display: flex; align-items: center; gap: 12px; }
        .logo { width: 36px; height: 36px; background: var(--accent); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: #000; }
        .title { font-size: 22px; font-weight: 800; background: linear-gradient(135deg, #3b82f6, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .live { display: flex; align-items: center; gap: 6px; margin-left: auto; font-size: 12px; color: var(--text2); }
        .live-dot { width: 6px; height: 6px; background: #ef4444; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

        /* Search */
        .search-box { width: 100%; background: var(--bg3); border: none; padding: 12px 16px; padding-left: 40px; border-radius: 500px; color: var(--text); font-size: 14px; margin: 12px 0; outline: none; }
        .search-wrap { position: relative; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text2); width: 18px; }

        /* Tabs */
        .tabs { display: flex; gap: 8px; padding: 0 16px; margin-bottom: 12px; overflow-x: auto; }
        .tab { padding: 10px 18px; background: var(--bg2); border: none; border-radius: 500px; color: var(--text2); font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
        .tab.active { background: var(--accent); color: #000; }
        .tab:active { transform: scale(0.95); }

        /* Request Button */
        .request-btn { display: block; margin: 0 16px 16px; padding: 14px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #fff; text-align: center; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }

        /* Main */
        .main { flex: 1; padding: 0 16px 140px; }
        .page-title { font-size: 24px; font-weight: bold; margin-bottom: 16px; }

        /* Grid */
        .song-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .song-card { background: var(--bg2); padding: 12px; border-radius: 8px; cursor: pointer; }
        .song-card:active { background: var(--bg3); }
        .album { width: 100%; aspect-ratio: 1; background: linear-gradient(135deg, #333, #222); border-radius: 4px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; position: relative; }
        .album svg { width: 36px; height: 36px; color: var(--text2); }
        .album img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
        .song-title { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .song-artist { font-size: 11px; color: var(--text2); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Artist Grid */
        .artist-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .artist-card { background: var(--bg2); padding: 16px; border-radius: 8px; text-align: center; cursor: pointer; }
        .artist-card:active { background: var(--bg3); }
        .artist-avatar { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #1e40af); margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .artist-name { font-size: 13px; font-weight: 600; }
        .artist-count { font-size: 11px; color: var(--text2); margin-top: 4px; }

        /* Load More */
        .load-more { text-align: center; padding: 16px; }
        .load-btn { background: var(--bg3); border: none; color: var(--text); padding: 12px 32px; border-radius: 500px; font-size: 14px; cursor: pointer; }
        .load-btn:active { background: var(--accent); color: #000; }

        /* Chat */
        .chat-box { display: flex; flex-direction: column; height: calc(100vh - 220px); background: var(--bg2); border-radius: 8px; overflow: hidden; }
        .chat-header { padding: 12px; background: var(--bg3); font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .chat-msgs { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .chat-msg { max-width: 80%; animation: fade 0.3s; }
        @keyframes fade { from{opacity:0;transform:translateY(10px)} }
        .chat-msg.sent { align-self: flex-end; }
        .chat-msg.recv { align-self: flex-start; }
        .chat-user { font-size: 10px; font-weight: bold; color: var(--accent); margin-bottom: 2px; }
        .chat-msg.sent .chat-user { color: #60a5fa; }
        .chat-bub { background: var(--bg3); padding: 8px 12px; border-radius: 12px; font-size: 14px; }
        .chat-msg.sent .chat-bub { background: var(--accent); color: #000; }
        .chat-input { display: flex; gap: 8px; padding: 12px; background: var(--bg3); }
        .chat-in { flex: 1; background: var(--bg2); border: none; padding: 10px 14px; border-radius: 500px; color: var(--text); font-size: 14px; outline: none; }
        .chat-send { background: var(--accent); border: none; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .chat-send svg { width: 18px; height: 18px; }

        /* Player */
        .player { position: fixed; bottom: 0; left: 0; right: 0; background: linear-gradient(90deg, #12122a, #1e1e3f); border-top: 1px solid var(--accent); padding: 10px 16px; display: flex; align-items: center; gap: 12px; z-index: 1000; }
        .player-art { width: 44px; height: 44px; background: var(--bg3); border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
        .player-art img { width: 100%; height: 100%; object-fit: cover; }
        .player-info { flex: 1; overflow: hidden; }
        .player-title { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .player-artist { font-size: 11px; color: var(--text2); }
        .player-controls { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
        .controls { display: flex; align-items: center; gap: 16px; }
        .ctrl-btn { background: none; border: none; color: var(--text2); cursor: pointer; padding: 4px; }
        .play-btn { width: 32px; height: 32px; background: var(--text); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #000; }
        .progress { display: flex; align-items: center; gap: 8px; width: 100%; }
        .time { font-size: 10px; color: var(--text2); min-width: 35px; }
        .bar { flex: 1; height: 4px; background: var(--bg3); border-radius: 2px; cursor: pointer; }
        .fill { height: 100%; background: var(--text); border-radius: 2px; width: 0%; }

        /* Back */
        .back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: var(--bg3); border: none; border-radius: 500px; color: var(--text2); font-size: 12px; margin-bottom: 12px; cursor: pointer; }

        /* Empty */
        .empty { text-align: center; padding: 40px; color: var(--text2); }
        .empty svg { width: 48px; height: 48px; opacity: 0.5; margin-bottom: 12px; }

        audio { display: none; }

        /* Landscape */
        @media (orientation: landscape) and (max-height: 500px) {
            .song-grid { grid-template-columns: repeat(3, 1fr); }
            .artist-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (min-width: 768px) {
            .song-grid { grid-template-columns: repeat(3, 1fr); }
            .artist-grid { grid-template-columns: repeat(4, 1fr); }
            .main { padding: 0 24px 120px; }
        }
    </style>
</head>
<body>
    <div class="loading" id="loading">
        <div class="spinner"></div>
        <div class="loading-text" id="loadText">Loading...</div>
        <div class="loading-sub" id="loadSub">Please wait</div>
    </div>

    <header class="header">
        <div class="header-row">
            <div class="logo">F</div>
            <span class="title">Funtify</span>
            <div class="live"><span class="live-dot"></span><span id="viewer">0</span></div>
        </div>
    </header>

    <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input type="text" class="search-box" id="searchInput" placeholder="Search songs or singers...">
    </div>

    <div class="tabs">
        <button class="tab active" data-tab="home" onclick="switchTab('home')">Home</button>
        <button class="tab" data-tab="singers" onclick="switchTab('singers')">Singers</button>
        <button class="tab" data-tab="chat" onclick="switchTab('chat')">Chat</button>
    </div>

    <a href="https://t.me/LLCteamcorp?direct" target="_blank" class="request-btn">Request Song</a>

    <main class="main" id="main"></main>

    <div class="player">
        <div class="player-art" id="playerArt"><svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>
        <div class="player-info"><div class="player-title" id="playerTitle">Select a song</div><div class="player-artist" id="playerArtist">-</div></div>
        <div class="player-controls">
            <div class="controls">
                <button class="ctrl-btn" id="prevBtn"><svg width="20" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" fill="currentColor"/></svg></button>
                <button class="ctrl-btn play-btn" id="playBtn"><svg width="16" viewBox="0 0 24 24" id="playIcon"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></button>
                <button class="ctrl-btn" id="nextBtn"><svg width="20" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor"/></svg></button>
            </div>
            <div class="progress">
                <span class="time" id="currTime">0:00</span>
                <div class="bar" id="progressBar"><div class="fill" id="progressFill"></div></div>
                <span class="time" id="totalTime">0:00</span>
            </div>
        </div>
    </div>

    <audio id="audio"></audio>

    <script>
        // State
        let songs = [];
        let artists = [];
        let displayed = [];
        let page = 1;
        let hasMore = true;
        let tab = 'home';
        let artist = null;
        let query = '';
        let currentIdx = -1;
        let playing = false;
        let chatMsgs = [];
        let loadCount = 50;

        const audio = document.getElementById('audio');
        const main = document.getElementById('main');

        // Fast loading
        async function init() {
            showLoading('Loading songs...', 'Getting your music');
            await loadSongs();
            hideLoading();
            render();
            startLiveCount();
        }

        async function loadSongs() {
            try {
                const res = await fetch('/api/songs?limit=' + loadCount);
                songs = await res.json();
                // Get unique artists
                const map = {};
                songs.forEach(s => {
                    const a = s.artist || 'Unknown';
                    map[a] = (map[a] || 0) + 1;
                });
                artists = Object.entries(map).map(([n,c])=>({name:n,count:c})).sort((a,b)=>b.count-a.count);
            } catch(e) {
                console.error(e);
                songs = [];
            }
        }

        function showLoading(text, sub) {
            document.getElementById('loadText').textContent = text;
            document.getElementById('loadSub').textContent = sub;
            document.getElementById('loading').classList.remove('hidden');
        }

        function hideLoading() {
            document.getElementById('loading').classList.add('hidden');
        }

        // Get filtered
        function getFiltered() {
            let f = songs;
            if (artist) f = f.filter(s => (s.artist||'') === artist);
            if (query) {
                const q = query.toLowerCase();
                f = f.filter(s => (s.title||'').toLowerCase().includes(q) || (s.artist||'').toLowerCase().includes(q));
            }
            return f;
        }

        // Render
        function render() {
            const f = getFiltered();
            displayed = f.slice(0, page * (page===1?loadCount:30));
            hasMore = displayed.length < f.length;

            if (tab === 'home') renderHome(f);
            else if (tab === 'singers') renderSingers();
            else if (tab === 'chat') renderChat();
            else if (tab === 'artist') renderArtist();
        }

        function renderHome(total) {
            let h = '<h1 class="page-title">' + (query ? 'Search Results' : 'Welcome to Funtify') + '</h1>';
            h += '<div class="song-grid">';
            displayed.forEach((s,i) => {
                const idx = songs.indexOf(s);
                h += '<div class="song-card" onclick="play('+idx+')">';
                h += '<div class="album">' + (s.art ? '<img src="/api/art/'+s.id+'">' : '<svg><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>') + '</div>';
                h += '<div class="song-title">' + (s.title||'Unknown').replace(/\\.[^.]+$/,'') + '</div>';
                h += '<div class="song-artist">' + (s.artist||'Unknown') + '</div></div>';
            });
            h += '</div>';
            if (hasMore) h += '<div class="load-more"><button class="load-btn" onclick="loadMore()">Load More ('+displayed.length+'/'+total.length+')</button></div>';
            if (!displayed.length) h += '<div class="empty"><svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/></svg><p>No songs found</p></div>';
            main.innerHTML = h;
        }

        function renderSingers() {
            let h = '<h1 class="page-title">Singers</h1><div class="artist-grid">';
            artists.forEach(a => {
                h += '<div class="artist-card" onclick="viewArtist(\\''+a.name+'\\')">';
                h += '<div class="artist-avatar">' + a.name.charAt(0).toUpperCase() + '</div>';
                h += '<div class="artist-name">' + a.name + '</div>';
                h += '<div class="artist-count">' + a.count + ' songs</div></div>';
            });
            h += '</div>';
            main.innerHTML = h;
        }

        function renderArtist() {
            const total = getFiltered();
            let h = '<button class="back-btn" onclick="switchTab(\\'singers\\')">Back to Singers</button>';
            h += '<h1 class="page-title">' + artist + '</h1>';
            h += '<div class="song-grid">';
            displayed.forEach(s => {
                const idx = songs.indexOf(s);
                h += '<div class="song-card" onclick="play('+idx+')">';
                h += '<div class="album">' + (s.art ? '<img src="/api/art/'+s.id+'">' : '<svg><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>') + '</div>';
                h += '<div class="song-title">' + (s.title||'Unknown').replace(/\\.[^.]+$/,'') + '</div>';
                h += '<div class="song-artist">' + (s.artist||'Unknown') + '</div></div>';
            });
            h += '</div>';
            if (hasMore) h += '<div class="load-more"><button class="load-btn" onclick="loadMore()">Load More</button></div>';
            main.innerHTML = h;
        }

        function renderChat() {
            let h = '<h1 class="page-title">Live Chat</h1>';
            h += '<div class="chat-box">';
            h += '<div class="chat-header"><span class="live-dot"></span> Live</div>';
            h += '<div class="chat-msgs" id="chatMsgs">';
            if (!chatMsgs.length) h += '<div class="empty"><p>No messages yet</p></div>';
            chatMsgs.forEach(m => {
                h += '<div class="chat-msg ' + (m.sent?'sent':'recv') + '">';
                h += '<div class="chat-user">' + m.user + '</div>';
                h += '<div class="chat-bub">' + m.text + '</div></div>';
            });
            h += '</div>';
            h += '<div class="chat-input"><input class="chat-in" id="chatIn" placeholder="Type..." onkeypress="if(event.key==\\'Enter\\')sendMsg()"><button class="chat-send" onclick="sendMsg()"><svg viewBox="0 0 24 24" fill="#000"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></div>';
            h += '</div>';
            main.innerHTML = h;
            setInterval(fetchChat, 3000);
        }

        function fetchChat() {
            if (tab !== 'chat') return;
            fetch('/api/chat').then(r=>r.json()).then(ms => {
                chatMsgs = ms.map(m=>({...m,sent:false}));
                const el = document.getElementById('chatMsgs');
                if (el) {
                    el.innerHTML = chatMsgs.map(m => '<div class="chat-msg '+(m.sent?'sent':'recv')+'"><div class="chat-user">'+m.user+'</div><div class="chat-bub">'+m.text+'</div></div>').join('');
                    el.scrollTop = el.scrollHeight;
                }
            });
        }

        function sendMsg() {
            const inp = document.getElementById('chatIn');
            const txt = inp.value.trim();
            if (!txt) return;
            chatMsgs.push({user:'You',text:txt,sent:true});
            inp.value = '';
            fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:txt,user:'Guest'})});
            render();
        }

        function switchTab(t) {
            tab = t;
            page = 1;
            artist = null;
            query = '';
            document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-tab="'+t+'"]').classList.add('active');
            document.getElementById('searchInput').value = '';
            render();
        }

        function viewArtist(name) {
            artist = name;
            tab = 'artist';
            page = 1;
            render();
        }

        function loadMore() {
            page++;
            render();
        }

        function play(idx) {
            currentIdx = idx;
            const s = songs[idx];
            document.getElementById('playerTitle').textContent = (s.title||'Unknown').replace(/\\.[^.]+$/,'');
            document.getElementById('playerArtist').textContent = s.artist || 'Unknown';
            if (s.art) document.getElementById('playerArt').innerHTML = '<img src="/api/art/'+s.id+'">';
            audio.src = '/api/stream/' + s.id;
            audio.play();
            playing = true;
            updatePlayBtn();
        }

        function togglePlay() {
            if (currentIdx === -1 && songs.length) { play(0); return; }
            if (playing) audio.pause(); else audio.play();
            playing = !playing;
            updatePlayBtn();
        }

        function updatePlayBtn() {
            document.getElementById('playIcon').innerHTML = playing ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
        }

        document.getElementById('playBtn').onclick = togglePlay;
        document.getElementById('prevBtn').onclick = () => currentIdx > 0 && play(currentIdx - 1);
        document.getElementById('nextBtn').onclick = () => currentIdx < songs.length - 1 && play(currentIdx + 1);

        audio.ontimeupdate = () => {
            if (audio.duration) {
                document.getElementById('progressFill').style.width = (audio.currentTime/audio.duration*100) + '%';
                document.getElementById('currTime').textContent = format(audio.currentTime);
            }
        };
        audio.onloadedmetadata = () => document.getElementById('totalTime').textContent = format(audio.duration);
        audio.onended = () => currentIdx < songs.length - 1 && play(currentIdx + 1);

        document.getElementById('progressBar').onclick = e => {
            if (!audio.duration) return;
            const rect = e.target.getBoundingClientRect();
            audio.currentTime = audio.duration * ((e.clientX - rect.left) / rect.width);
        };

        function format(s) {
            if (!s) return '0:00';
            return Math.floor(s/60) + ':' + Math.floor(s%60).toString().padStart(2,'0');
        }

        document.getElementById('searchInput').oninput = e => {
            query = e.target.value;
            page = 1;
            if (tab === 'artist') tab = 'home';
            render();
        };

        function startLiveCount() {
            let c = Math.floor(Math.random()*500)+100;
            setInterval(() => { c += Math.floor(Math.random()*21)-10; c = Math.max(50,c); document.getElementById('viewer').textContent = c; }, 5000);
        }

        init();
    </script>
</body>
</html>
`;

const ADMIN_HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin</title><style>body{background:#0a0a1a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif}.c{max-width:400px;width:100%;padding:30px;background:#12122a;border-radius:12px;text-align:center}p{color:#94a3b8;margin-bottom:20px}input{width:100%;padding:14px;background:#1e1e3f;border:2px solid #1e1e3f;border-radius:8px;color:#fff;font-size:16px;margin-bottom:15px;outline:none}input:focus{border-color:#3b82f6}button{width:100%;padding:14px;background:#3b82f6;border:none;border-radius:8px;color:#000;font-size:16px;font-weight:bold;cursor:pointer}.e{color:#ef4444;display:none;margin-top:10px}</style></head><body><div class="c" id="login"><h1>Admin</h1><p>Enter password</p><input type="password"id="p"placeholder="Password"><button onclick="check()">Login</button><p class="e"id="e">Wrong password</p></div><div class="c"id="dash"style="display:none"><h1>Dashboard</h1><p id="stats">Loading...</p><a href="/"style="color:#3b82f6;display:block;margin-top:20px">Back</a></div><script>function check(){if(document.getElementById('p').value==='LLCstaff2026'){document.getElementById('login').style.display='none';document.getElementById('dash').style.display='block';loadStats()}else{document.getElementById('e').style.display='block'}}async function loadStats(){try{const r=await fetch('/api/songs');const s=await r.json();document.getElementById('stats').innerHTML='Songs: '+s.length}catch(e){}}</script></body></html>`;

let chatMessages = [];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const q = url.searchParams;

    const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};

    if (request.method === 'OPTIONS') return new Response(null,{headers:cors});

    if (path === '/2026/whatisthis') return new Response(ADMIN_HTML,{headers:{...cors,'Content-Type':'text/html'}});

    // Chat API - ephemeral
    if (path === '/api/chat') {
      if (request.method === 'GET') return new Response(JSON.stringify(chatMessages),{headers:{...cors,'Content-Type':'application/json'}});
      if (request.method === 'POST') {
        const b = await request.json();
        chatMessages.push({user:b.user||'Guest',text:b.text,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});
        if (chatMessages.length > 50) chatMessages = chatMessages.slice(-50);
        return new Response(JSON.stringify({success:true}),{headers:{...cors,'Content-Type':'application/json'}});
      }
    }

    try {
      // Songs API - optimized pagination
      if (path === '/api/songs') {
        const limit = parseInt(q.get('limit')) || 50;
        const offset = parseInt(q.get('offset')) || 0;
        const search = q.get('q') || '';

        const allSongs = [];

        // Fetch from KV
        try {
          const list = await env.FUNTIFY_KV.list({prefix:'song:meta:'});
          for (const key of list.keys) {
            const m = await env.FUNTIFY_KV.get(key.name);
            if (m) {
              const meta = JSON.parse(m);
              allSongs.push({id:meta.id,title:meta.title,artist:meta.fromUser||'Unknown',duration:meta.duration||0,createdAt:meta.createdAt,art:false});
            }
          }
        } catch(e) {}

        try {
          const list2 = await env.FUNTIFY_KV.list({prefix:'metadata:'});
          for (const key of list2.keys) {
            const m = await env.FUNTIFY_KV.get(key.name);
            if (m) {
              const meta = JSON.parse(m);
              allSongs.push({id:meta.id,title:meta.title,artist:meta.artist||'Unknown',duration:meta.duration||0,createdAt:meta.createdAt,art:meta.art||false});
            }
          }
        } catch(e) {}

        // Sort
        allSongs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Filter search
        let filtered = allSongs;
        if (search) {
          const s = search.toLowerCase();
          filtered = allSongs.filter(sg => (sg.title||'').toLowerCase().includes(s) || (sg.artist||'').toLowerCase().includes(s));
        }

        // Paginate
        const paged = filtered.slice(offset, offset + limit);

        return new Response(JSON.stringify(paged),{headers:{...cors,'Content-Type':'application/json'}});
      }

      // Stream
      if (path.startsWith('/api/stream/')) {
        const id = path.split('/').pop();
        let data = await env.FUNTIFY_KV.get('song:data:'+id,{type:'arrayBuffer'});
        if (!data) data = await env.FUNTIFY_KV.get('audio:'+id,{type:'arrayBuffer'});
        if (!data) return new Response('Not found',{status:404});

        const range = request.headers.get('Range');
        if (range) {
          const [s,e] = range.replace('bytes=','').split('-');
          const start = parseInt(s)||0;
          const end = parseInt(e)||data.byteLength-1;
          const chunk = data.slice(start,end+1);
          return new Response(chunk,{status:206,headers:{...cors,'Content-Type':'audio/mpeg','Content-Range':'bytes '+start+'-'+end+'/'+data.byteLength,'Accept-Ranges':'bytes','Content-Length':chunk.byteLength}});
        }
        return new Response(data,{headers:{...cors,'Content-Type':'audio/mpeg','Accept-Ranges':'bytes'}});
      }

      // Art
      if (path.startsWith('/api/art/')) {
        const id = path.split('/').pop();
        let art = await env.FUNTIFY_KV.get('art:'+id);
        if (!art) {
          const meta = await env.FUNTIFY_KV.get('song:meta:'+id);
          if (meta) {
            const m = JSON.parse(meta);
            if (m.artKey) art = await env.FUNTIFY_KV.get(m.artKey);
          }
        }
        if (!art) return new Response('Not found',{status:404});
        return new Response(art,{headers:{...cors,'Content-Type':'image/jpeg'}});
      }

      // Default - serve HTML
      return new Response(HTML,{headers:{...cors,'Content-Type':'text/html'}});

    } catch(e) {
      return new Response('Error: '+e,{status:500});
    }
  }
};