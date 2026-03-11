// Funtify - Cloudflare Workers Backend (Enhanced Version)
// Features: Infinite scroll (50 initial, 30 more), Singers tab, Live Chat, Song Request
// Database: Cloudflare KV
// Note: Only reads songs, upload disabled for web users

const HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="theme-color" content="#0a0a1a">
    <meta name="screen-orientation" content="portrait">
    <title>Funtify</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --bg-primary: #0a0a1a;
            --bg-secondary: #12122a;
            --bg-tertiary: #1e1e3f;
            --accent: #3b82f6;
            --text-primary: #ffffff;
            --text-secondary: #94a3b8;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .orientation-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(10, 10, 26, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease-in-out;
        }

        .orientation-overlay.visible {
            opacity: 1;
            pointer-events: auto;
        }

        .orientation-text {
            font-size: 28px;
            font-weight: bold;
            color: var(--accent);
            text-align: center;
            text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        .portrait-header {
            display: none;
            background: #000;
            padding: 16px 20px;
            position: sticky;
            top: 0;
            z-index: 100;
            border-bottom: 1px solid var(--bg-tertiary);
        }

        .portrait-header-content {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .portrait-logo-row {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .portrait-logo {
            width: 40px;
            height: 40px;
            object-fit: contain;
        }

        .portrait-title {
            font-size: 24px;
            font-weight: 800;
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .live-viewers {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: var(--text-secondary);
            margin-left: auto;
        }

        .live-dot {
            width: 8px;
            height: 8px;
            background: #ef4444;
            border-radius: 50%;
            animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.2); }
        }

        .viewer-count {
            font-weight: 600;
            color: var(--text-primary);
        }

        .sidebar {
            width: 240px;
            background: #000;
            height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .logo {
            font-size: 28px;
            font-weight: bold;
            color: var(--accent);
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
        }

        .logo-icon {
            width: 120px;
            height: 50px;
            min-width: 120px;
            object-fit: contain;
        }

        .logo img {
            width: 120px;
            height: auto;
            max-height: 50px;
            object-fit: contain;
        }

        .logo-text {
            font-size: 26px;
            font-weight: 800;
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.5px;
        }

        .search-container {
            margin-bottom: 20px;
        }

        .search-box {
            width: 100%;
            background: var(--bg-tertiary);
            border: none;
            padding: 12px 16px;
            padding-left: 40px;
            border-radius: 500px;
            color: var(--text-primary);
            font-size: 14px;
            outline: none;
            transition: all 0.3s;
        }

        .search-box::placeholder {
            color: var(--text-secondary);
        }

        .search-box:focus {
            background: #3e3e3e;
            box-shadow: 0 0 0 2px var(--accent);
        }

        .search-wrapper {
            position: relative;
        }

        .search-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
            width: 18px;
            height: 18px;
            pointer-events: none;
        }

        .search-clear {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 4px;
            display: none;
            border-radius: 50%;
            transition: all 0.2s;
        }

        .search-clear:hover {
            color: var(--text-primary);
            background: var(--bg-tertiary);
        }

        .search-clear.visible {
            display: block;
        }

        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #0a0a1a 0%, #1e3a5f 50%, #0a0a1a 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 1;
            transition: opacity 0.5s ease;
        }

        .loading-overlay.hidden {
            opacity: 0;
            pointer-events: none;
        }

        .loading-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(59, 130, 246, 0.3);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 24px;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .loading-text {
            font-size: 22px;
            color: var(--accent);
            text-align: center;
            padding: 0 20px;
            animation: pulse 1.5s ease-in-out infinite;
            font-weight: 600;
            text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.7; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.02); }
        }

        .loading-subtext {
            font-size: 16px;
            color: var(--text-secondary);
            margin-top: 12px;
            opacity: 0.8;
            font-style: italic;
        }

        .load-more-container {
            text-align: center;
            padding: 24px;
        }

        .load-more-btn {
            background: var(--bg-tertiary);
            border: none;
            color: var(--text-primary);
            padding: 12px 32px;
            border-radius: 500px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
        }

        .load-more-btn:hover {
            background: var(--accent);
            color: #000;
        }

        .load-more-btn.loading {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .nav-menu {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 12px 16px;
            color: var(--text-secondary);
            text-decoration: none;
            border-radius: 4px;
            transition: all 0.2s;
            font-weight: 500;
            cursor: pointer;
            border: none;
            background: transparent;
            width: 100%;
            text-align: left;
            font-size: 14px;
        }

        .nav-item:hover, .nav-item.active {
            color: var(--text-primary);
            background: var(--bg-tertiary);
        }

        .nav-item svg {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
        }

        .request-song-btn {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s;
            margin-top: 8px;
        }

        .request-song-btn:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
        }

        .main-content {
            margin-left: 240px;
            padding: 24px 32px;
            padding-bottom: 120px;
            min-height: 100vh;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .page-title {
            font-size: 32px;
            font-weight: bold;
        }

        .hero {
            background: linear-gradient(180deg, #1e3a5f 0%, var(--bg-primary) 100%);
            padding: 32px;
            border-radius: 8px;
            margin-bottom: 32px;
        }

        .hero h1 {
            font-size: 48px;
            margin-bottom: 16px;
        }

        .hero p {
            color: var(--text-secondary);
            font-size: 16px;
        }

        .section {
            margin-bottom: 40px;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .section-title {
            font-size: 24px;
            font-weight: bold;
        }

        .song-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 24px;
        }

        .song-card {
            background: var(--bg-secondary);
            padding: 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s;
        }

        .song-card:hover {
            background: var(--bg-tertiary);
        }

        .song-card:hover .play-btn {
            opacity: 1;
            transform: translateY(0);
        }

        .album-art {
            width: 100%;
            aspect-ratio: 1;
            background: linear-gradient(135deg, #333 0%, #222 100%);
            border-radius: 4px;
            margin-bottom: 16px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .album-art img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .album-art svg {
            width: 48px;
            height: 48px;
            color: var(--text-secondary);
        }

        .play-btn {
            position: absolute;
            bottom: 8px;
            right: 8px;
            width: 48px;
            height: 48px;
            background: var(--accent);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transform: translateY(8px);
            transition: all 0.3s;
            box-shadow: 0 8px 16px rgba(0,0,0,0.3);
            border: none;
            cursor: pointer;
        }

        .play-btn svg {
            width: 24px;
            height: 24px;
            color: #000;
            opacity: 1;
            transform: none;
        }

        .song-title {
            font-weight: bold;
            margin-bottom: 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .song-artist {
            color: var(--text-secondary);
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .artist-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 24px;
        }

        .artist-card {
            background: var(--bg-secondary);
            padding: 24px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
        }

        .artist-card:hover {
            background: var(--bg-tertiary);
            transform: scale(1.02);
        }

        .artist-avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent) 0%, #1e40af 100%);
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            color: white;
            overflow: hidden;
        }

        .artist-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .artist-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 4px;
        }

        .artist-count {
            color: var(--text-secondary);
            font-size: 13px;
        }

        .song-list-container {
            padding: 0;
        }

        .song-list-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .info-badge {
            background: var(--bg-tertiary);
            color: var(--text-secondary);
            border: none;
            padding: 12px 24px;
            border-radius: 500px;
            font-weight: 500;
            cursor: default;
        }

        .song-table {
            width: 100%;
            border-collapse: collapse;
        }

        .song-table th {
            text-align: left;
            padding: 12px;
            color: var(--text-secondary);
            font-weight: 500;
            font-size: 12px;
            border-bottom: 1px solid var(--bg-tertiary);
        }

        .song-table td {
            padding: 12px;
            border-bottom: 1px solid var(--bg-tertiary);
        }

        .song-table tr:hover {
            background: var(--bg-tertiary);
        }

        .song-table .title-cell {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .song-table .art {
            width: 40px;
            height: 40px;
            background: var(--bg-tertiary);
            border-radius: 4px;
            flex-shrink: 0;
            overflow: hidden;
        }

        .song-table .art img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .chat-container {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 180px);
            background: var(--bg-secondary);
            border-radius: 8px;
            overflow: hidden;
        }

        .chat-header {
            padding: 16px 20px;
            background: var(--bg-tertiary);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .chat-header h3 {
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .chat-live-dot {
            width: 8px;
            height: 8px;
            background: #ef4444;
            border-radius: 50%;
            animation: pulse-dot 2s ease-in-out infinite;
        }

        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .chat-message {
            display: flex;
            flex-direction: column;
            max-width: 80%;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .chat-message.sent {
            align-self: flex-end;
        }

        .chat-message.received {
            align-self: flex-start;
        }

        .chat-user {
            font-size: 12px;
            font-weight: bold;
            color: var(--accent);
            margin-bottom: 4px;
        }

        .chat-message.sent .chat-user {
            color: #60a5fa;
        }

        .chat-bubble {
            background: var(--bg-tertiary);
            padding: 10px 14px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.4;
        }

        .chat-message.sent .chat-bubble {
            background: var(--accent);
            color: #000;
            border-bottom-right-radius: 4px;
        }

        .chat-message.received .chat-bubble {
            border-bottom-left-radius: 4px;
        }

        .chat-time {
            font-size: 10px;
            color: var(--text-secondary);
            margin-top: 4px;
        }

        .chat-input-area {
            padding: 16px;
            background: var(--bg-tertiary);
            display: flex;
            gap: 12px;
        }

        .chat-input {
            flex: 1;
            background: var(--bg-secondary);
            border: none;
            padding: 12px 16px;
            border-radius: 500px;
            color: var(--text-primary);
            font-size: 14px;
            outline: none;
        }

        .chat-input::placeholder {
            color: var(--text-secondary);
        }

        .chat-send-btn {
            background: var(--accent);
            border: none;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .chat-send-btn:hover {
            transform: scale(1.1);
        }

        .chat-send-btn svg {
            width: 20px;
            height: 20px;
            color: #000;
        }

        .no-results {
            text-align: center;
            padding: 60px 20px;
            color: var(--text-secondary);
        }

        .no-results svg {
            width: 64px;
            height: 64px;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .no-results h3 {
            font-size: 24px;
            margin-bottom: 8px;
            color: var(--text-primary);
        }

        .player-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(90deg, #12122a 0%, #1e1e3f 100%);
            border-top: 1px solid #3b82f6;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 1000;
        }

        .player-info {
            display: flex;
            align-items: center;
            gap: 16px;
            width: 30%;
        }

        .player-art {
            width: 56px;
            height: 56px;
            background: var(--bg-tertiary);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            flex-shrink: 0;
        }

        .player-art img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .player-details {
            display: flex;
            flex-direction: column;
            gap: 4px;
            overflow: hidden;
        }

        .player-title {
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .player-artist {
            font-size: 11px;
            color: var(--text-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .player-controls {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            width: 40%;
        }

        .control-buttons {
            display: flex;
            align-items: center;
            gap: 24px;
        }

        .control-btn {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            transition: color 0.2s;
            padding: 4px;
        }

        .control-btn:hover {
            color: var(--text-primary);
        }

        .control-btn.play-pause {
            width: 36px;
            height: 36px;
            background: var(--text-primary);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
        }

        .control-btn.play-pause:hover {
            transform: scale(1.05);
        }

        .progress-container {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
        }

        .time {
            font-size: 11px;
            color: var(--text-secondary);
            min-width: 40px;
        }

        .progress-bar {
            flex: 1;
            height: 4px;
            background: var(--bg-tertiary);
            border-radius: 2px;
            cursor: pointer;
            position: relative;
        }

        .progress-fill {
            height: 100%;
            background: var(--text-primary);
            border-radius: 2px;
            width: 0%;
            transition: width 0.1s;
        }

        .progress-bar:hover .progress-fill {
            background: var(--accent);
        }

        .volume-controls {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 30%;
            justify-content: flex-end;
        }

        .volume-btn {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 4px;
        }

        .volume-slider {
            width: 100px;
            height: 4px;
            -webkit-appearance: none;
            background: var(--bg-tertiary);
            border-radius: 2px;
            outline: none;
        }

        .volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            background: var(--text-primary);
            border-radius: 50%;
            cursor: pointer;
        }

        audio {
            display: none !important;
        }

        @media (max-width: 768px) {
            .sidebar {
                display: none;
            }

            .main-content {
                margin-left: 0;
            }

            .player-bar {
                flex-direction: column;
                gap: 12px;
                padding: 12px;
            }

            .player-info, .player-controls, .volume-controls {
                width: 100%;
            }

            .volume-controls {
                display: none;
            }

            .chat-container {
                height: calc(100vh - 200px);
            }
        }

        @media (orientation: portrait) {
            .sidebar {
                display: none !important;
            }

            .main-content {
                margin-left: 0;
                padding-top: 16px;
            }

            .portrait-header {
                display: block;
            }

            .hero h1 {
                font-size: 32px;
            }

            .song-grid {
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 16px;
            }

            .artist-grid {
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 16px;
            }
        }

        @media (orientation: landscape) and (max-height: 500px) {
            .sidebar {
                display: none !important;
            }

            .main-content {
                margin-left: 0;
            }

            .portrait-header {
                display: block;
            }
        }
    </style>
</head>
<body>
    <div class="orientation-overlay" id="orientationOverlay">
        <div class="orientation-text" id="orientationText"></div>
    </div>

    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-spinner"></div>
        <div class="loading-text" id="loadingText">wait lang louding pa....</div>
        <div class="loading-subtext">Loading your music...</div>
    </div>

    <header class="portrait-header" id="portraitHeader">
        <div class="portrait-header-content">
            <div class="portrait-logo-row">
                <img class="portrait-logo" src="https://image2url.com/r2/default/images/1772765382411-ee137768-a08b-4366-838a-8376b66c7158.png" alt="Funtify Logo">
                <span class="portrait-title">Funtify</span>
                <div class="live-viewers">
                    <span class="live-dot"></span>
                    <span class="viewer-count" id="viewerCount">0</span>
                    <span>listening now</span>
                </div>
            </div>
            <div class="search-container">
                <div class="search-wrapper">
                    <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input type="text" class="search-box" id="portraitSearchInput" placeholder="Search songs...">
                    <button class="search-clear" id="portraitSearchClear" onclick="clearPortraitSearch()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="nav-menu" style="flex-direction: row; gap: 8px;">
                <button class="nav-item active" data-tab="home" onclick="switchTab('home')">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    Home
                </button>
                <button class="nav-item" data-tab="singers" onclick="switchTab('singers')">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                    Singers
                </button>
                <button class="nav-item" data-tab="chat" onclick="switchTab('chat')">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/></svg>
                    Chat
                </button>
            </div>
        </div>
    </header>

    <nav class="sidebar">
        <div class="logo">
            <img class="logo-icon" src="https://image2url.com/r2/default/images/1772765382411-ee137768-a08b-4366-838a-8376b66c7158.png" alt="Funtify Logo">
            <span class="logo-text">Funtify</span>
        </div>

        <div class="search-container">
            <div class="search-wrapper">
                <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <input type="text" class="search-box" id="searchInput" placeholder="Search songs...">
                <button class="search-clear" id="searchClear" onclick="clearSearch()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
        </div>

        <div class="nav-menu">
            <button class="nav-item active" data-tab="home" onclick="switchTab('home')">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                Home
            </button>
            <button class="nav-item" data-tab="singers" onclick="switchTab('singers')">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                Singers
            </button>
            <button class="nav-item" data-tab="chat" onclick="switchTab('chat')">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/></svg>
                Live Chat
            </button>
        </div>

        <a href="https://t.me/LLCteamcorp?direct" target="_blank" class="request-song-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            Request Song
        </a>

        <div style="margin-top: auto; padding-top: 24px; border-top: 1px solid var(--bg-tertiary);">
            <div style="color: var(--text-secondary); font-size: 12px; padding: 0 16px;">
                <p style="margin-bottom: 8px;">Upload songs via Telegram Bot</p>
                <p>@FuntifyMusicBot</p>
            </div>
        </div>
    </nav>

    <main class="main-content" id="mainContent">
    </main>

    <div class="player-bar">
        <div class="player-info">
            <div class="player-art" id="playerArt">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            </div>
            <div class="player-details">
                <div class="player-title" id="playerTitle">Select a song</div>
                <div class="player-artist" id="playerArtist">-</div>
            </div>
        </div>

        <div class="player-controls">
            <div class="control-buttons">
                <button class="control-btn" id="shuffleBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
                </button>
                <button class="control-btn" id="prevBtn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                <button class="control-btn play-pause" id="playPauseBtn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" id="playIcon"><path d="M8 5v14l11-7z"/></svg>
                </button>
                <button class="control-btn" id="nextBtn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
                <button class="control-btn" id="repeatBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
                </button>
            </div>
            <div class="progress-container">
                <span class="time" id="currentTime">0:00</span>
                <div class="progress-bar" id="progressBar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <span class="time" id="totalTime">0:00</span>
            </div>
        </div>

        <div class="volume-controls">
            <button class="volume-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            </button>
            <input type="range" class="volume-slider" id="volumeSlider" min="0" max="100" value="100">
        </div>
    </div>

    <audio id="audioPlayer" controlsList="nodownload"></audio>

    <script>
        let allSongs = [];
        let displayedSongs = [];
        let currentPage = 1;
        let isLoading = false;
        let hasMore = true;
        let searchQuery = '';
        let currentTab = 'home';
        let selectedArtist = null;
        let currentSongIndex = -1;
        let isPlaying = false;
        let liveViewerCount = 0;

        const INITIAL_LOAD = 50;
        const LOAD_MORE = 30;

        let chatMessages = [];
        let chatPollInterval = null;

        let audioPlayer = document.getElementById('audioPlayer');

        const loadingPhrases = [
            'wait lang louding pa....',
            'wait lang kasi nag lolouidng pa nganiiiiiii....',
            'wag kang nag mamadali free na ngax eh...',
            'pa load po dito 20...'
        ];

        let loadingInterval;
        function startLoadingText() {
            const loadingTextEl = document.getElementById('loadingText');
            let index = 0;
            loadingInterval = setInterval(() => {
                index = Math.floor(Math.random() * loadingPhrases.length);
                loadingTextEl.textContent = loadingPhrases[index];
            }, 2000);
        }

        function stopLoadingText() {
            clearInterval(loadingInterval);
        }

        function hideLoading() {
            const overlay = document.getElementById('loadingOverlay');
            overlay.classList.add('hidden');
            stopLoadingText();
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }

        let currentOrientation = '';
        function checkOrientation() {
            const isPortrait = window.innerHeight > window.innerWidth;
            const newOrientation = isPortrait ? 'portrait' : 'landscape';

            if (currentOrientation !== '' && currentOrientation !== newOrientation) {
                showOrientationOverlay(newOrientation);
            }
            currentOrientation = newOrientation;
        }

        function showOrientationOverlay(orientation) {
            const overlay = document.getElementById('orientationOverlay');
            const text = document.getElementById('orientationText');

            if (orientation === 'portrait') {
                text.textContent = "you are in portrait mode";
            } else {
                text.textContent = "you are in landscape mode";
            }

            overlay.classList.add('visible');

            setTimeout(() => {
                overlay.classList.remove('visible');
            }, 2000);
        }

        function initOrientationDetection() {
            checkOrientation();
            window.addEventListener('resize', checkOrientation);
            window.addEventListener('orientationchange', () => {
                setTimeout(checkOrientation, 100);
            });
        }

        function initLiveViewerCount() {
            liveViewerCount = Math.floor(Math.random() * 500) + 100;
            updateViewerCount();

            setInterval(() => {
                const change = Math.floor(Math.random() * 21) - 10;
                liveViewerCount = Math.max(50, liveViewerCount + change);
                updateViewerCount();
            }, 5000);
        }

        function updateViewerCount() {
            const viewerElements = document.querySelectorAll('.viewer-count');
            viewerElements.forEach(el => {
                el.textContent = liveViewerCount.toLocaleString();
            });
        }

        const mainContent = document.getElementById('mainContent');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const playIcon = document.getElementById('playIcon');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        const currentTimeEl = document.getElementById('currentTime');
        const totalTimeEl = document.getElementById('totalTime');
        const volumeSlider = document.getElementById('volumeSlider');
        const playerTitle = document.getElementById('playerTitle');
        const playerArtist = document.getElementById('playerArtist');
        const playerArt = document.getElementById('playerArt');

        async function loadAllSongs() {
            try {
                const response = await fetch('/api/songs');
                allSongs = await response.json();
            } catch (error) {
                console.error('Error loading songs:', error);
                allSongs = [];
            }
        }

        function getFilteredSongs() {
            let filtered = allSongs;

            if (selectedArtist) {
                filtered = filtered.filter(song =>
                    (song.artist || '').toLowerCase() === selectedArtist.toLowerCase()
                );
            }

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(song => {
                    const title = cleanTitle(song.title).toLowerCase();
                    const artist = (song.artist || '').toLowerCase();
                    return title.includes(query) || artist.includes(query);
                });
            }

            return filtered;
        }

        function getPaginatedSongs(page, isInitial = false) {
            const filtered = getFilteredSongs();
            const limit = isInitial ? INITIAL_LOAD : LOAD_MORE;
            const offset = isInitial ? 0 : INITIAL_LOAD + ((page - 2) * LOAD_MORE);

            return {
                songs: filtered.slice(offset, offset + limit),
                hasMore: (offset + limit) < filtered.length,
                total: filtered.length
            };
        }

        function getArtists() {
            const artistMap = new Map();

            allSongs.forEach(song => {
                const artist = song.artist || 'Unknown Artist';
                if (artistMap.has(artist)) {
                    artistMap.set(artist, artistMap.get(artist) + 1);
                } else {
                    artistMap.set(artist, 1);
                }
            });

            return Array.from(artistMap.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);
        }

        function cleanTitle(title) {
            if (!title) return 'Unknown';
            return title.replace(/\.(mp3|m4a|mp4|ogg|wav|flac|aac)$/i, '').trim();
        }

        function formatDuration(seconds) {
            if (!seconds) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return mins + ':' + secs.toString().padStart(2, '0');
        }

        function switchTab(tab) {
            currentTab = tab;
            currentPage = 1;
            searchQuery = '';
            selectedArtist = null;
            displayedSongs = [];

            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.tab === tab) {
                    btn.classList.add('active');
                }
            });

            document.getElementById('searchInput').value = '';
            const portraitSearchInput = document.getElementById('portraitSearchInput');
            if (portraitSearchInput) portraitSearchInput.value = '';

            renderCurrentTab();
        }

        function renderCurrentTab() {
            switch (currentTab) {
                case 'home':
                    renderHome();
                    break;
                case 'singers':
                    renderSingers();
                    break;
                case 'chat':
                    renderChat();
                    break;
                case 'artist-playlist':
                    renderArtistPlaylist();
                    break;
            }
        }

        function renderHome() {
            const result = getPaginatedSongs(currentPage, currentPage === 1);
            const songs = result.songs;
            const total = result.total;

            if (currentPage === 1) {
                displayedSongs = songs;
            } else {
                displayedSongs = displayedSongs.concat(songs);
            }

            hasMore = result.hasMore;

            if (displayedSongs.length === 0) {
                mainContent.innerHTML = '<div class="no-results"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg><h3>No songs found</h3><p>Upload songs via Telegram Bot @FuntifyMusicBot</p></div>';
                return;
            }

            const isSearchMode = searchQuery !== '';

            let html = '';

            if (isSearchMode) {
                html += '<div class="page-header"><h1 class="page-title">Search Results</h1><span class="info-badge">' + total + ' songs found</span></div>';
            } else {
                html += '<div class="hero"><h1>Welcome to Funtify</h1><p>Listen to your favorite music. Upload songs via Telegram Bot @FuntifyMusicBot</p></div>';
            }

            html += '<section class="section"><div class="song-grid">';

            displayedSongs.forEach((song, index) => {
                const songIndex = allSongs.indexOf(song);
                const artHtml = song.art ? '<img src="/api/art/' + song.id + '" alt="Album Art">' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';

                html += '<div class="song-card" onclick="playSong(' + songIndex + ')">';
                html += '<div class="album-art">' + artHtml + '<button class="play-btn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button></div>';
                html += '<div class="song-title">' + cleanTitle(song.title) + '</div>';
                html += '<div class="song-artist">' + (song.artist || 'Unknown Artist') + '</div>';
                html += '</div>';
            });

            html += '</div></section>';

            if (hasMore) {
                html += '<div class="load-more-container"><button class="load-more-btn" id="loadMoreBtn" onclick="loadMore()">Load More Songs</button></div>';
            }

            mainContent.innerHTML = html;
        }

        function loadMore() {
            if (isLoading || !hasMore) return;

            const btn = document.getElementById('loadMoreBtn');
            if (btn) {
                btn.classList.add('loading');
                btn.textContent = 'Loading...';
            }

            currentPage++;
            const result = getPaginatedSongs(currentPage);
            displayedSongs = displayedSongs.concat(result.songs);
            hasMore = result.hasMore;

            const songGrids = document.querySelectorAll('.song-grid');
            if (songGrids.length > 0) {
                let newHtml = '';
                displayedSongs.forEach((song, index) => {
                    const songIndex = allSongs.indexOf(song);
                    const artHtml = song.art ? '<img src="/api/art/' + song.id + '" alt="Album Art">' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';

                    newHtml += '<div class="song-card" onclick="playSong(' + songIndex + ')">';
                    newHtml += '<div class="album-art">' + artHtml + '<button class="play-btn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button></div>';
                    newHtml += '<div class="song-title">' + cleanTitle(song.title) + '</div>';
                    newHtml += '<div class="song-artist">' + (song.artist || 'Unknown Artist') + '</div>';
                    newHtml += '</div>';
                });
                songGrids[0].innerHTML = newHtml;
            }

            const loadMoreContainer = document.querySelector('.load-more-container');
            if (loadMoreContainer) {
                if (hasMore) {
                    btn.classList.remove('loading');
                    btn.textContent = 'Load More Songs';
                } else {
                    loadMoreContainer.remove();
                }
            }
        }

        function renderSingers() {
            const artists = getArtists();

            if (artists.length === 0) {
                mainContent.innerHTML = '<div class="no-results"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg><h3>No singers found</h3><p>Upload songs to see singers</p></div>';
                return;
            }

            let html = '<div class="page-header"><h1 class="page-title">Singers</h1><span class="info-badge">' + artists.length + ' artists</span></div><section class="section"><div class="artist-grid">';

            artists.forEach(artist => {
                html += '<div class="artist-card" onclick="viewArtist(\'' + artist.name + '\')">';
                html += '<div class="artist-avatar">' + artist.name.charAt(0).toUpperCase() + '</div>';
                html += '<div class="artist-name">' + artist.name + '</div>';
                html += '<div class="artist-count">' + artist.count + ' songs</div>';
                html += '</div>';
            });

            html += '</div></section>';

            mainContent.innerHTML = html;
        }

        function viewArtist(artistName) {
            selectedArtist = artistName;
            currentTab = 'artist-playlist';
            currentPage = 1;
            displayedSongs = [];

            renderArtistPlaylist();
        }

        function renderArtistPlaylist() {
            const result = getPaginatedSongs(currentPage, currentPage === 1);
            const songs = result.songs;
            const total = result.total;

            if (currentPage === 1) {
                displayedSongs = songs;
            } else {
                displayedSongs = displayedSongs.concat(songs);
            }

            hasMore = result.hasMore;

            let html = '<div class="page-header"><div>';
            html += '<button class="nav-item" onclick="switchTab(\'singers\')" style="margin-bottom: 16px; display: inline-flex; padding: 8px 16px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>Back to Singers</button>';
            html += '<h1 class="page-title">' + selectedArtist + '</h1>';
            html += '<span class="info-badge">' + total + ' songs</span>';
            html += '</div></div>';

            html += '<section class="section"><div class="song-grid">';

            displayedSongs.forEach((song, index) => {
                const songIndex = allSongs.indexOf(song);
                const artHtml = song.art ? '<img src="/api/art/' + song.id + '" alt="Album Art">' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';

                html += '<div class="song-card" onclick="playSong(' + songIndex + ')">';
                html += '<div class="album-art">' + artHtml + '<button class="play-btn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button></div>';
                html += '<div class="song-title">' + cleanTitle(song.title) + '</div>';
                html += '<div class="song-artist">' + (song.artist || 'Unknown Artist') + '</div>';
                html += '</div>';
            });

            html += '</div></section>';

            if (hasMore) {
                html += '<div class="load-more-container"><button class="load-more-btn" id="loadMoreBtn" onclick="loadMore()">Load More Songs</button></div>';
            }

            mainContent.innerHTML = html;
        }

        function renderChat() {
            let messagesHtml = '';

            if (chatMessages.length === 0) {
                messagesHtml = '<div class="no-results" style="padding: 40px;"><p>No messages yet. Start the conversation!</p></div>';
            } else {
                chatMessages.forEach(msg => {
                    messagesHtml += renderChatMessage(msg);
                });
            }

            mainContent.innerHTML = '<div class="page-header"><h1 class="page-title">Live Chat</h1><div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary);"><span class="chat-live-dot"></span><span>Live</span></div></div><div class="chat-container"><div class="chat-messages" id="chatMessages">' + messagesHtml + '</div><div class="chat-input-area"><input type="text" class="chat-input" id="chatInput" placeholder="Type a message..." onkeypress="handleChatKeyPress(event)"><button class="chat-send-btn" onclick="sendChatMessage()"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></div></div>';

            const chatMessagesEl = document.getElementById('chatMessages');
            if (chatMessagesEl) {
                chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
            }

            startChatPolling();
        }

        function renderChatMessage(msg) {
            return '<div class="chat-message ' + (msg.isSent ? 'sent' : 'received') + '"><div class="chat-user">' + msg.user + '</div><div class="chat-bubble">' + msg.text + '</div><div class="chat-time">' + msg.time + '</div></div>';
        }

        async function sendChatMessage() {
            const input = document.getElementById('chatInput');
            const text = input.value.trim();

            if (!text) return;

            const msg = {
                user: 'You',
                text: text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isSent: true
            };

            chatMessages.push(msg);
            input.value = '';

            const chatMessagesEl = document.getElementById('chatMessages');
            if (chatMessagesEl) {
                const noResults = chatMessagesEl.querySelector('.no-results');
                if (noResults) noResults.remove();

                chatMessagesEl.innerHTML += renderChatMessage(msg);
                chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
            }

            try {
                await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text, user: 'Guest' })
                });
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }

        function handleChatKeyPress(event) {
            if (event.key === 'Enter') {
                sendChatMessage();
            }
        }

        function startChatPolling() {
            if (chatPollInterval) {
                clearInterval(chatPollInterval);
            }

            chatPollInterval = setInterval(async () => {
                if (currentTab !== 'chat') {
                    clearInterval(chatPollInterval);
                    return;
                }

                try {
                    const response = await fetch('/api/chat');
                    const messages = await response.json();

                    if (messages.length !== chatMessages.length) {
                        chatMessages = messages.map(msg => ({
                            ...msg,
                            isSent: false
                        }));

                        const chatMessagesEl = document.getElementById('chatMessages');
                        if (chatMessagesEl) {
                            let html = '';
                            chatMessages.forEach(msg => {
                                html += renderChatMessage(msg);
                            });
                            chatMessagesEl.innerHTML = html;
                            chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
                        }
                    }
                } catch (error) {
                    console.error('Error fetching chat:', error);
                }
            }, 3000);
        }

        function setupSearch() {
            const searchInput = document.getElementById('searchInput');
            const searchClear = document.getElementById('searchClear');

            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    searchQuery = e.target.value.trim().toLowerCase();

                    if (searchQuery) {
                        searchClear.classList.add('visible');
                    } else {
                        searchClear.classList.remove('visible');
                    }

                    const portraitSearchInput = document.getElementById('portraitSearchInput');
                    if (portraitSearchInput) {
                        portraitSearchInput.value = e.target.value;
                    }

                    currentPage = 1;
                    displayedSongs = [];

                    if (currentTab !== 'home' && currentTab !== 'artist-playlist') {
                        switchTab('home');
                    } else {
                        renderCurrentTab();
                    }
                }, 300);
            });

            const portraitSearchInput = document.getElementById('portraitSearchInput');
            const portraitSearchClear = document.getElementById('portraitSearchClear');

            if (portraitSearchInput) {
                portraitSearchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        searchQuery = e.target.value.trim().toLowerCase();

                        if (searchQuery) {
                            portraitSearchClear.classList.add('visible');
                        } else {
                            portraitSearchClear.classList.remove('visible');
                        }

                        if (searchInput) {
                            searchInput.value = e.target.value;
                        }

                        currentPage = 1;
                        displayedSongs = [];

                        if (currentTab !== 'home' && currentTab !== 'artist-playlist') {
                            switchTab('home');
                        } else {
                            renderCurrentTab();
                        }
                    }, 300);
                });
            }
        }

        function clearSearch() {
            const searchInput = document.getElementById('searchInput');
            const searchClear = document.getElementById('searchClear');
            searchInput.value = '';
            searchClear.classList.remove('visible');
            searchQuery = '';

            const portraitSearchInput = document.getElementById('portraitSearchInput');
            const portraitSearchClear = document.getElementById('portraitSearchClear');
            if (portraitSearchInput) portraitSearchInput.value = '';
            if (portraitSearchClear) portraitSearchClear.classList.remove('visible');

            currentPage = 1;
            displayedSongs = [];
            renderCurrentTab();
        }

        function clearPortraitSearch() {
            clearSearch();
        }

        function playSong(index) {
            if (index < 0 || index >= allSongs.length) return;

            currentSongIndex = index;
            const song = allSongs[index];

            audioPlayer.src = '/api/stream/' + song.id;
            audioPlayer.play();
            isPlaying = true;

            playerTitle.textContent = cleanTitle(song.title);
            playerArtist.textContent = song.artist || 'Unknown Artist';

            if (song.art) {
                playerArt.innerHTML = '<img src="/api/art/' + song.id + '" width="56" height="56">';
            } else {
                playerArt.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
            }

            updatePlayButton();
        }

        function togglePlay() {
            if (currentSongIndex === -1 && allSongs.length > 0) {
                playSong(0);
                return;
            }

            if (isPlaying) {
                audioPlayer.pause();
            } else {
                audioPlayer.play();
            }
            isPlaying = !isPlaying;
            updatePlayButton();
        }

        function updatePlayButton() {
            if (isPlaying) {
                playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
            } else {
                playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
            }
        }

        audioPlayer.addEventListener('timeupdate', () => {
            if (audioPlayer.duration) {
                const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressFill.style.width = progress + '%';
                currentTimeEl.textContent = formatDuration(audioPlayer.currentTime);
            }
        });

        audioPlayer.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = formatDuration(audioPlayer.duration);
        });

        progressBar.addEventListener('click', (e) => {
            if (!audioPlayer.duration) return;
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audioPlayer.currentTime = percent * audioPlayer.duration;
        });

        volumeSlider.addEventListener('input', (e) => {
            audioPlayer.volume = e.target.value / 100;
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            if (currentSongIndex < allSongs.length - 1) {
                playSong(currentSongIndex + 1);
            }
        });

        document.getElementById('prevBtn').addEventListener('click', () => {
            if (currentSongIndex > 0) {
                playSong(currentSongIndex - 1);
            }
        });

        playPauseBtn.addEventListener('click', togglePlay);

        audioPlayer.addEventListener('ended', () => {
            if (currentSongIndex < allSongs.length - 1) {
                playSong(currentSongIndex + 1);
            }
        });

        async function init() {
            startLoadingText();
            setupSearch();
            initOrientationDetection();
            initLiveViewerCount();

            await loadAllSongs();
            renderHome();
            hideLoading();
        }

        init();

        window.addEventListener('popstate', () => {
            init();
        });

        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'AUDIO' || e.target.closest('audio')) {
                e.preventDefault();
            }
        });
    </script>
</body>
</html>
`;

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Funtify</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a1a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .admin-container { max-width: 500px; width: 100%; padding: 40px; background: #12122a; border-radius: 16px; text-align: center; border: 1px solid #1e1e3f; }
        .admin-container h1 { font-size: 32px; margin-bottom: 24px; background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .admin-container p { color: #94a3b8; margin-bottom: 24px; }
        .admin-password-input { width: 100%; padding: 16px; border: 2px solid #1e1e3f; border-radius: 8px; background: #1e1e3f; color: #fff; font-size: 16px; margin-bottom: 16px; outline: none; }
        .admin-password-input:focus { border-color: #3b82f6; }
        .admin-submit-btn { width: 100%; padding: 16px; background: #3b82f6; border: none; border-radius: 8px; color: #000; font-size: 16px; font-weight: bold; cursor: pointer; }
        .admin-error { color: #ef4444; margin-top: 16px; display: none; }
        .admin-error.visible { display: block; }
        .admin-dashboard { display: none; }
        .admin-dashboard.active { display: block; }
        .admin-stat { display: flex; justify-content: space-between; padding: 16px; background: #1e1e3f; border-radius: 8px; margin-bottom: 12px; }
        .admin-stat-label { color: #94a3b8; }
        .admin-stat-value { font-weight: bold; color: #3b82f6; }
        .admin-back-btn { display: inline-block; margin-top: 24px; padding: 12px 24px; background: transparent; border: 1px solid #3b82f6; border-radius: 500px; color: #3b82f6; text-decoration: none; font-weight: 500; }
    </style>
</head>
<body>
    <div class="admin-container" id="adminLogin">
        <h1>Admin Panel</h1>
        <p>Enter password to access the admin panel</p>
        <form onsubmit="handleAdminLogin(event)">
            <input type="password" class="admin-password-input" id="adminPassword" placeholder="Enter password" required>
            <button type="submit" class="admin-submit-btn">Login</button>
        </form>
        <p class="admin-error" id="adminError">Incorrect password. Please try again.</p>
    </div>
    <div class="admin-container admin-dashboard" id="adminDashboard">
        <h1>Admin Dashboard</h1>
        <div class="admin-stat"><span class="admin-stat-label">Total Songs</span><span class="admin-stat-value" id="totalSongs">-</span></div>
        <div class="admin-stat"><span class="admin-stat-label">Total Playlists</span><span class="admin-stat-value" id="totalPlaylists">-</span></div>
        <div class="admin-stat"><span class="admin-stat-label">Current Viewers</span><span class="admin-stat-value" id="currentViewers">-</span></div>
        <a href="/" class="admin-back-btn">Back to Funtify</a>
    </div>
    <script>
        const ADMIN_PASSWORD = 'LLCstaff2026';
        function handleAdminLogin(event) {
            event.preventDefault();
            const password = document.getElementById('adminPassword').value;
            const errorEl = document.getElementById('adminError');
            if (password === ADMIN_PASSWORD) {
                document.getElementById('adminLogin').style.display = 'none';
                document.getElementById('adminDashboard').classList.add('active');
                loadAdminStats();
            } else {
                errorEl.classList.add('visible');
            }
        }
        async function loadAdminStats() {
            try {
                const songsRes = await fetch('/api/songs');
                const songs = await songsRes.json();
                document.getElementById('totalSongs').textContent = songs.length;
                const playlistsRes = await fetch('/api/playlists');
                const playlists = await playlistsRes.json();
                document.getElementById('totalPlaylists').textContent = playlists.length;
                document.getElementById('currentViewers').textContent = Math.floor(Math.random() * 500) + 100;
            } catch (error) { console.error('Error loading admin stats:', error); }
        }
    </script>
</body>
</html>`;

let chatMessages = [];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const query = url.search;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (path === '/2026/whatisthis' || path === '/2026/whatisthis?') {
      return new Response(ADMIN_HTML, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    if (path === '/api/chat') {
      if (request.method === 'GET') {
        return new Response(JSON.stringify(chatMessages), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (request.method === 'POST') {
        const body = await request.json();
        const { text, user } = body;

        if (!text) {
          return new Response(JSON.stringify({ error: 'Missing text' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const msg = {
          user: user || 'Guest',
          text: text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        };

        chatMessages.push(msg);

        if (chatMessages.length > 50) {
          chatMessages = chatMessages.slice(-50);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    try {
      if (path === '/api/songs') {
        const songs = [];

        try {
          const botList = await env.FUNTIFY_KV.list({ prefix: 'song:meta:' });

          for (const key of botList.keys) {
            const metadata = await env.FUNTIFY_KV.get(key.name);
            if (metadata) {
              const meta = JSON.parse(metadata);
              songs.push({
                id: meta.id,
                title: meta.title || 'Unknown',
                artist: meta.fromUser || 'Unknown Artist',
                duration: meta.duration || 0,
                createdAt: meta.createdAt || new Date().toISOString(),
                art: false,
                source: 'bot'
              });
            }
          }
        } catch (e) {
          console.error('Error fetching bot songs:', e);
        }

        try {
          const workerList = await env.FUNTIFY_KV.list({ prefix: 'metadata:' });
          for (const key of workerList.keys) {
            const metadata = await env.FUNTIFY_KV.get(key.name);
            if (metadata) {
              const meta = JSON.parse(metadata);
              songs.push({
                id: meta.id,
                title: meta.title || 'Unknown',
                artist: meta.artist || 'Unknown Artist',
                duration: meta.duration || 0,
                createdAt: meta.createdAt || new Date().toISOString(),
                art: meta.art || false,
                source: 'worker'
              });
            }
          }
        } catch (e) {
          console.error('Error fetching worker songs:', e);
        }

        songs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return new Response(JSON.stringify(songs), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/stream/')) {
        const songId = path.split('/').pop();

        let audioData = await env.FUNTIFY_KV.get('song:data:' + songId, { type: 'arrayBuffer' });
        let contentType = 'audio/mpeg';

        if (!audioData) {
          audioData = await env.FUNTIFY_KV.get('audio:' + songId, { type: 'arrayBuffer' });
        }

        if (!audioData) {
          return new Response('Audio not found', { status: 404 });
        }

        const range = request.headers.get('Range');
        if (range) {
          const [startStr, endStr] = range.replace('bytes=', '').split('-');
          const start = parseInt(startStr, 10) || 0;
          const end = endStr ? parseInt(endStr, 10) : audioData.byteLength - 1;
          const chunk = audioData.slice(start, end + 1);

          return new Response(chunk, {
            status: 206,
            headers: {
              ...corsHeaders,
              'Content-Type': contentType,
              'Content-Range': 'bytes ' + start + '-' + end + '/' + audioData.byteLength,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunk.byteLength,
            },
          });
        }

        return new Response(audioData, {
          headers: {
            ...corsHeaders,
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
          },
        });
      }

      if (path.startsWith('/api/art/')) {
        const songId = path.split('/').pop();

        let artData = await env.FUNTIFY_KV.get('art:' + songId);

        if (!artData) {
          const metaRaw = await env.FUNTIFY_KV.get('song:meta:' + songId);
          if (metaRaw) {
            const meta = JSON.parse(metaRaw);
            if (meta.artKey) {
              artData = await env.FUNTIFY_KV.get(meta.artKey);
            }
          }
        }

        if (!artData) {
          return new Response('Image not found', { status: 404 });
        }

        return new Response(artData, {
          headers: { ...corsHeaders, 'Content-Type': 'image/jpeg' },
        });
      }

      if (path === '/api/bot/upload' && request.method === 'POST') {
        const body = await request.json();
        const { songId, audioData, metadata, artData } = body;

        if (!songId || !audioData || !metadata) {
          return new Response(JSON.stringify({ error: 'Missing data' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0)).buffer;

        await env.FUNTIFY_KV.put('song:meta:' + songId, JSON.stringify(metadata));
        await env.FUNTIFY_KV.put('song:data:' + songId, audioBuffer);

        if (artData) {
          const artBuffer = Uint8Array.from(atob(artData), c => c.charCodeAt(0)).buffer;
          await env.FUNTIFY_KV.put('song:art:' + songId, artBuffer);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/api/debug/keys' && request.method === 'GET') {
        const allKeys = await env.FUNTIFY_KV.list();
        return new Response(JSON.stringify(allKeys.keys.map(k => k.name)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/api/playlists') {
        if (request.method === 'GET') {
          const playlists = [];
          try {
            const list = await env.FUNTIFY_KV.list({ prefix: 'playlist:' });
            for (const key of list.keys) {
              const data = await env.FUNTIFY_KV.get(key.name);
              if (data) {
                playlists.push(JSON.parse(data));
              }
            }
          } catch (e) {
            console.error('Error fetching playlists:', e);
          }
          return new Response(JSON.stringify(playlists), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (request.method === 'POST') {
          const body = await request.json();
          const { id, name, songs, createdAt } = body;

          if (!id || !name) {
            return new Response(JSON.stringify({ error: 'Missing data' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const playlist = { id, name, songs: songs || [], createdAt };
          await env.FUNTIFY_KV.put('playlist:' + id, JSON.stringify(playlist));

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (request.method === 'PUT') {
          const body = await request.json();
          const { id, name, songs, createdAt } = body;

          if (!id) {
            return new Response(JSON.stringify({ error: 'Missing ID' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const playlist = { id, name, songs: songs || [], createdAt };
          await env.FUNTIFY_KV.put('playlist:' + id, JSON.stringify(playlist));

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(HTML, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
