// Funtify - Cloudflare Workers Backend
// Database: Cloudflare KV
// Features: Music streaming, metadata storage, Spotify-like UI
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

        /* Orientation Overlay */
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

        /* Portrait Mode Header (visible only in portrait) */
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

        /* Live Viewer Count */
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

        /* Sidebar */
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

        /* Search Box */
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

        /* Loading Overlay */
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

        .loading-gif {
            width: 120px;
            height: 120px;
            object-fit: contain;
            margin-bottom: 24px;
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

        /* Search Results */
        .search-results-header {
            margin-bottom: 24px;
        }

        .search-results-header h1 {
            font-size: 32px;
            margin-bottom: 8px;
        }

        .search-results-count {
            color: var(--text-secondary);
            font-size: 14px;
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

        .nav-menu {
            display: flex;
            flex-direction: column;
            gap: 12px;
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
        }

        .nav-item:hover, .nav-item.active {
            color: var(--text-primary);
            background: var(--bg-tertiary);
        }

        .nav-item svg {
            width: 24px;
            height: 24px;
        }

        /* Main Content */
        .main-content {
            margin-left: 240px;
            padding: 24px 32px;
            padding-bottom: 120px;
            min-height: 100vh;
        }

        /* Header */
        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
        }

        .search-box {
            background: var(--bg-tertiary);
            border: none;
            padding: 12px 16px;
            border-radius: 500px;
            color: var(--text-primary);
            width: 300px;
            font-size: 14px;
        }

        .search-box::placeholder {
            color: var(--text-secondary);
        }

        .user-profile {
            display: flex;
            align-items: center;
            gap: 12px;
            background: var(--bg-tertiary);
            padding: 4px 12px 4px 4px;
            border-radius: 500px;
            cursor: pointer;
        }

        .user-avatar {
            width: 28px;
            height: 28px;
            background: var(--accent);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
        }

        /* Hero Section */
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

        /* Section Titles */
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

        .see-all {
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: color 0.2s;
        }

        .see-all:hover {
            color: var(--text-primary);
        }

        .see-all.loading {
            color: var(--accent);
        }

        /* Song Grid */
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

        /* Player Bar */
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
        }

        .player-title {
            font-size: 14px;
            font-weight: 500;
        }

        .player-artist {
            font-size: 11px;
            color: var(--text-secondary);
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

        /* Playlist Styles */
        .playlist-section {
            margin-top: 32px;
        }

        .playlist-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .create-playlist-btn {
            background: var(--accent);
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 500px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .create-playlist-btn:hover {
            transform: scale(1.05);
        }

        .playlist-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 24px;
        }

        .playlist-card {
            background: var(--bg-secondary);
            padding: 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s;
        }

        .playlist-card:hover {
            background: var(--bg-tertiary);
        }

        .playlist-cover {
            width: 100%;
            aspect-ratio: 1;
            background: linear-gradient(135deg, #3b82f6 0%, #191414 100%);
            border-radius: 4px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .playlist-cover svg {
            width: 48px;
            height: 48px;
            color: var(--text-primary);
        }

        .playlist-name {
            font-weight: bold;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .playlist-count {
            color: var(--text-secondary);
            font-size: 14px;
        }

        .playlist-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 2000;
            align-items: center;
            justify-content: center;
        }

        .playlist-modal.active {
            display: flex;
        }

        .playlist-modal-content {
            background: var(--bg-secondary);
            padding: 32px;
            border-radius: 8px;
            width: 400px;
            max-width: 90%;
        }

        .playlist-modal h2 {
            margin-bottom: 24px;
        }

        .playlist-modal input {
            width: 100%;
            background: var(--bg-tertiary);
            border: none;
            padding: 12px 16px;
            border-radius: 4px;
            color: var(--text-primary);
            font-size: 14px;
            margin-bottom: 16px;
        }

        .playlist-modal-buttons {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }

        .playlist-modal-buttons button {
            padding: 12px 24px;
            border-radius: 500px;
            cursor: pointer;
            font-weight: bold;
        }

        .btn-cancel {
            background: transparent;
            border: 1px solid var(--text-secondary);
            color: var(--text-primary);
        }

        .btn-create {
            background: var(--accent);
            border: none;
            color: #000;
        }

        .add-to-playlist-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: all 0.2s;
        }

        .add-to-playlist-btn:hover {
            color: var(--text-primary);
            background: var(--bg-tertiary);
        }

        /* Song List Page */
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
        }

        /* Audio element hidden */
        audio {
            display: none !important;
        }

        /* Admin Page Styles */
        .admin-container {
            max-width: 500px;
            margin: 50px auto;
            padding: 40px;
            background: var(--bg-secondary);
            border-radius: 16px;
            text-align: center;
        }

        .admin-container h1 {
            font-size: 32px;
            margin-bottom: 24px;
            color: var(--accent);
        }

        .admin-container p {
            color: var(--text-secondary);
            margin-bottom: 24px;
        }

        .admin-password-input {
            width: 100%;
            padding: 16px;
            border: 2px solid var(--bg-tertiary);
            border-radius: 8px;
            background: var(--bg-tertiary);
            color: var(--text-primary);
            font-size: 16px;
            margin-bottom: 16px;
            transition: border-color 0.3s;
        }

        .admin-password-input:focus {
            outline: none;
            border-color: var(--accent);
        }

        .admin-submit-btn {
            width: 100%;
            padding: 16px;
            background: var(--accent);
            border: none;
            border-radius: 8px;
            color: #000;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .admin-submit-btn:hover {
            transform: scale(1.02);
        }

        .admin-error {
            color: #ef4444;
            margin-top: 16px;
            display: none;
        }

        .admin-success {
            display: none;
        }

        .admin-dashboard {
            display: none;
        }

        .admin-dashboard.active {
            display: block;
        }

        .admin-stat {
            display: flex;
            justify-content: space-between;
            padding: 16px;
            background: var(--bg-tertiary);
            border-radius: 8px;
            margin-bottom: 12px;
        }

        .admin-stat-label {
            color: var(--text-secondary);
        }

        .admin-stat-value {
            font-weight: bold;
            color: var(--accent);
        }

        /* Responsive */
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
        }

        /* Portrait Mode Styles */
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
        }

        /* Landscape mode but narrow (like landscape mobile) */
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
    <!-- Orientation Overlay -->
    <div class="orientation-overlay" id="orientationOverlay">
        <div class="orientation-text" id="orientationText"></div>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <img class="loading-gif" src="https://image2url.com/r2/default/gifs/1773400686335-d714b227-56f0-4c6b-a3ce-df6400692fc0.gif" alt="Loading">
        <div class="loading-text" id="loadingText">wait lang louding pa....</div>
        <div class="loading-subtext">Loading your music...</div>
    </div>

    <!-- Portrait Mode Header -->
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
        </div>
    </header>

    <!-- Sidebar -->
    <nav class="sidebar">
        <div class="logo">
            <img class="logo-icon" src="https://image2url.com/r2/default/images/1772765382411-ee137768-a08b-4366-838a-8376b66c7158.png" alt="Funtify Logo">
            <span class="logo-text">Funtify</span>
        </div>

        <!-- Search Box -->
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
            <a href="/" class="nav-item active" data-page="home">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                Home
            </a>
            <a href="/song/list" class="nav-item" data-page="library">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/></svg>
                Your Library
            </a>
        </div>

        <div style="margin-top: auto; padding-top: 24px; border-top: 1px solid var(--bg-tertiary);">
            <div style="color: var(--text-secondary); font-size: 12px; padding: 0 16px;">
                <p style="margin-bottom: 8px;">Upload songs via Telegram Bot</p>
                <p style="margin-bottom: 12px;">@FuntifyMusicBot</p>
                <p style="margin-bottom: 8px; color: var(--accent);">Request a Song</p>
                <a href="https://t.me/LLCteamcorp?direct" target="_blank" rel="noopener" style="color: var(--text-secondary); text-decoration: none; display: block; transition: color 0.2s;" onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='var(--text-secondary)'">
                    <span style="display: flex; align-items: center; gap: 4px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
                        t.me/LLCteamcorp
                    </span>
                </a>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content" id="mainContent">
        <!-- Content will be loaded here -->
    </main>

    <!-- Player Bar -->
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

    <!-- Audio Element -->
    <audio id="audioPlayer" controlsList="nodownload"></audio>

    <script>
        // State
        let songs = [];
        let playlists = [];
        let currentPlaylist = null;
        let currentSongIndex = -1;
        let isPlaying = false;
        let audioPlayer = document.getElementById('audioPlayer');
        let searchQuery = '';
        let liveViewerCount = 0;
        let activeUserId = null;
        let heartbeatInterval = null;
        let isUserActive = true;
        
        // Pagination state for infinite scroll
        let currentPage = 0;
        let songsPerPage = 50;
        let isLoadingMore = false;
        let hasMoreSongs = true;
        let totalLoadedSongs = 0;
        let songListObserver = null;

        // Filipino loading phrases
        const loadingPhrases = [
            'wait lang louding pa....',
            'wait lang kasi nag lolouidng pa nganiiiiiii....',
            'wag kang nag mamadali free na ngax eh...',
            'pa load po dito 20...'
        ];

        // Loading text rotation
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

        // Hide loading overlay
        function hideLoading() {
            const overlay = document.getElementById('loadingOverlay');
            overlay.classList.add('hidden');
            stopLoadingText();
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }

        // Orientation detection with fade effect
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

            // Fade in
            overlay.classList.add('visible');

            // Wait and fade out
            setTimeout(() => {
                overlay.classList.remove('visible');
            }, 2000);
        }

        // Initialize orientation detection
        function initOrientationDetection() {
            checkOrientation();
            window.addEventListener('resize', checkOrientation);
            window.addEventListener('orientationchange', () => {
                setTimeout(checkOrientation, 100);
            });
        }

        // Generate unique user ID for this session
        function generateUserId() {
            const stored = localStorage.getItem('funtify_user_id');
            if (stored) return stored;
            const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('funtify_user_id', newId);
            return newId;
        }
        
        // Register user as active and start heartbeat
        async function registerUser() {
            try {
                activeUserId = generateUserId();
                const response = await fetch('/api/users/heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        userId: activeUserId, 
                        isPlaying: isPlaying,
                        currentSongId: currentSongIndex >= 0 ? songs[currentSongIndex]?.id : null,
                        timestamp: Date.now()
                    })
                });
                const data = await response.json();
                liveViewerCount = data.activeUsers || 0;
                updateViewerCount();
            } catch (error) {
                console.error('Error registering user:', error);
                liveViewerCount = 1;
                updateViewerCount();
            }
        }
        
        // Send heartbeat to keep user active
        async function sendHeartbeat() {
            if (!activeUserId) return;
            
            try {
                const response = await fetch('/api/users/heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        userId: activeUserId, 
                        isPlaying: isPlaying,
                        currentSongId: currentSongIndex >= 0 ? songs[currentSongIndex]?.id : null,
                        timestamp: Date.now()
                    })
                });
                const data = await response.json();
                liveViewerCount = data.activeUsers || 0;
                updateViewerCount();
            } catch (error) {
                // Silent fail for heartbeat
            }
        }
        
        // Unregister user when leaving
        async function unregisterUser() {
            if (!activeUserId) return;
            
            try {
                await fetch('/api/users/unregister', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: activeUserId })
                });
            } catch (error) {
                // Silent fail
            }
        }
        
        // Initialize accurate live viewer count
        function initLiveViewerCount() {
            // Register user immediately
            registerUser();
            
            // Start heartbeat - send every 10 seconds
            heartbeatInterval = setInterval(() => {
                if (isUserActive) {
                    sendHeartbeat();
                }
            }, 10000);
            
            // Handle visibility change - pause heartbeat when tab is hidden
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    isUserActive = false;
                    // Send one heartbeat when hiding
                    sendHeartbeat();
                } else {
                    isUserActive = true;
                    // Resume heartbeat and update count
                    sendHeartbeat();
                }
            });
            
            // Handle before unload - unregister user
            window.addEventListener('beforeunload', () => {
                unregisterUser();
            });
            
            // Handle page hide (mobile)
            window.addEventListener('pagehide', () => {
                unregisterUser();
            });
            
            // Handle online/offline
            window.addEventListener('online', () => {
                registerUser();
            });
        }

        function updateViewerCount() {
            const viewerElements = document.querySelectorAll('.viewer-count');
            viewerElements.forEach(el => {
                el.textContent = liveViewerCount.toLocaleString();
            });
        }

        // Elements
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

        // Load songs from API with pagination
        async function loadSongs(page = 0, append = false) {
            try {
                const response = await fetch('/api/songs?page=' + page + '&limit=' + songsPerPage);
                const newSongs = await response.json();
                
                if (append) {
                    songs = [...songs, ...newSongs];
                } else {
                    songs = newSongs;
                    totalLoadedSongs = newSongs.length;
                }
                
                hasMoreSongs = newSongs.length >= songsPerPage;
                currentPage = page;
                
                return newSongs;
            } catch (error) {
                console.error('Error loading songs:', error);
                if (!append) {
                    songs = [];
                }
                return [];
            }
        }
        
        // Load more songs for infinite scroll
        async function loadMoreSongs() {
            if (isLoadingMore || !hasMoreSongs || searchQuery) return;
            
            isLoadingMore = true;
            const loadingEl = document.getElementById('loadingMoreIndicator');
            if (loadingEl) loadingEl.style.display = 'block';
            
            try {
                const nextPage = currentPage + 1;
                await loadSongs(nextPage, true);
                
                // Update the UI based on current page
                const path = window.location.pathname;
                if (path === '/song/list') {
                    // Update song list table
                    const tbody = document.getElementById('songTableBody');
                    if (tbody) {
                        const filteredSongs = getFilteredSongs();
                        tbody.innerHTML = filteredSongs.map((song, index) => `
                            <tr onclick="playSong(${songs.indexOf(song)})">
                                <td>${index + 1}</td>
                                <td>
                                    <div class="title-cell">
                                        <div class="art">
                                            ${song.art ? `<img src="/api/art/${song.id}" width="40" height="40">` : ''}
                                        </div>
                                        <div>
                                            <div style="font-weight: 500;">${cleanTitle(song.title)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>${formatDuration(song.duration)}</td>
                            </tr>
                        `).join('');
                    }
                } else {
                    // Update home page song grid
                    const grid = document.getElementById('recentlyAddedGrid');
                    const seeAllLink = document.getElementById('seeAllLink');
                    if (seeAllLink) {
                        seeAllLink.textContent = `See all (${songs.length} songs)`;
                    }
                    
                    // Add new songs to grid (show last 20)
                    if (grid) {
                        const filteredSongs = getFilteredSongs();
                        const startIndex = Math.max(0, filteredSongs.length - 20);
                        const recentSongs = filteredSongs.slice(startIndex);
                        
                        grid.innerHTML = recentSongs.map((song) => `
                            <div class="song-card" onclick="playSong(${songs.indexOf(song)})">
                                <div class="album-art">
                                    ${song.art ? `<img src="/api/art/${song.id}" alt="Album Art">` : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>'}
                                    <button class="play-btn">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                    </button>
                                </div>
                                <div class="song-title">${cleanTitle(song.title)}</div>
                                <div class="song-artist">${song.artist || 'Unknown Artist'}</div>
                            </div>
                        `).join('');
                    }
                }
            } catch (error) {
                console.error('Error loading more songs:', error);
            } finally {
                isLoadingMore = false;
                if (loadingEl) loadingEl.style.display = 'none';
            }
        }
        
        // Setup infinite scroll observer
        function setupInfiniteScroll() {
            // Create loading indicator
            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'loadingMoreIndicator';
            loadingIndicator.style.cssText = 'display:none;text-align:center;padding:20px;color:var(--text-secondary);';
            loadingIndicator.innerHTML = 'Loading more songs...';
            
            // For song list page
            const songTable = document.querySelector('.song-table tbody');
            if (songTable) {
                songTable.parentElement.appendChild(loadingIndicator);
            }
            
            // Create observer for infinite scroll
            songListObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !isLoadingMore && hasMoreSongs && !searchQuery) {
                        loadMoreSongs();
                    }
                });
            }, { rootMargin: '100px' });
            
            // Observe the loading indicator
            if (loadingIndicator.parentElement) {
                songListObserver.observe(loadingIndicator);
            }
        }

        // Load playlists from API
        async function loadPlaylists() {
            try {
                const response = await fetch('/api/playlists');
                playlists = await response.json();
            } catch (error) {
                console.error('Error loading playlists:', error);
                playlists = [];
            }
        }

        // Create playlist
        async function createPlaylist(name) {
            if (!name.trim()) return;

            const playlist = {
                id: 'playlist_' + Date.now(),
                name: name.trim(),
                songs: [],
                createdAt: new Date().toISOString()
            };

            try {
                await fetch('/api/playlists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(playlist)
                });
                playlists.push(playlist);
                renderHome();
            } catch (error) {
                console.error('Error creating playlist:', error);
            }
        }

        // Add song to playlist
        async function addToPlaylist(playlistId, songId) {
            const playlist = playlists.find(p => p.id === playlistId);
            if (!playlist || playlist.songs.includes(songId)) return;

            playlist.songs.push(songId);

            try {
                await fetch('/api/playlists', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(playlist)
                });
            } catch (error) {
                console.error('Error adding to playlist:', error);
            }
        }

        // Play playlist
        function playPlaylist(playlistId) {
            const playlist = playlists.find(p => p.id === playlistId);
            if (!playlist || playlist.songs.length === 0) return;

            // Get songs in playlist order
            const playlistSongs = playlist.songs.map(songId => songs.find(s => s.id === songId)).filter(s => s);

            if (playlistSongs.length > 0) {
                currentPlaylist = playlist;
                songs = playlistSongs;
                playSong(0);
            }
        }

        // Render create playlist modal
        function renderCreatePlaylistModal() {
            return \`
                <div class="playlist-modal active" id="createPlaylistModal">
                    <div class="playlist-modal-content">
                        <h2>Create Playlist</h2>
                        <input type="text" id="playlistNameInput" placeholder="Playlist name" />
                        <div class="playlist-modal-buttons">
                            <button class="btn-cancel" onclick="closeModal()">Cancel</button>
                            <button class="btn-create" onclick="submitCreatePlaylist()">Create</button>
                        </div>
                    </div>
                </div>
            \`;
        }

        // Submit create playlist
        function submitCreatePlaylist() {
            const input = document.getElementById('playlistNameInput');
            if (input.value.trim()) {
                createPlaylist(input.value);
                closeModal();
            }
        }

        // Close modal
        function closeModal() {
            const modal = document.getElementById('createPlaylistModal');
            if (modal) {
                modal.classList.remove('active');
                modal.remove();
            }
        }

        // Render playlists section
        function renderPlaylists() {
            if (playlists.length === 0) return '';

            return \`
                <section class="playlist-section">
                    <div class="playlist-header">
                        <h2 class="section-title">Your Playlists</h2>
                        <button class="create-playlist-btn" onclick="showCreatePlaylistModal()">+ Create Playlist</button>
                    </div>
                    <div class="playlist-grid">
                        \${playlists.map(playlist => \`
                            <div class="playlist-card" onclick="playPlaylist('\${playlist.id}')">
                                <div class="playlist-cover">
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
                                </div>
                                <div class="playlist-name">\${playlist.name}</div>
                                <div class="playlist-count">\${playlist.songs.length} songs</div>
                            </div>
                        \`).join('')}
                    </div>
                </section>
            \`;
        }

        // Show create playlist modal
        function showCreatePlaylistModal() {
            const existing = document.getElementById('createPlaylistModal');
            if (existing) existing.remove();

            const div = document.createElement('div');
            div.innerHTML = renderCreatePlaylistModal();
            document.body.appendChild(div.firstElementChild);

            document.getElementById('playlistNameInput').focus();
            document.getElementById('playlistNameInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') submitCreatePlaylist();
            });
        }

        // Remove file extension from title
        function cleanTitle(title) {
            if (!title) return 'Unknown';
            // Remove common audio extensions
            return title.replace(/\.(mp3|m4a|mp4|ogg|wav|flac|aac)$/i, '').trim();
        }

        // Search functionality
        function setupSearch() {
            // Desktop search
            const searchInput = document.getElementById('searchInput');
            const searchClear = document.getElementById('searchClear');

            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.trim().toLowerCase();

                // Show/hide clear button
                if (searchQuery) {
                    searchClear.classList.add('visible');
                } else {
                    searchClear.classList.remove('visible');
                }

                // Also update portrait search
                const portraitSearchInput = document.getElementById('portraitSearchInput');
                if (portraitSearchInput) {
                    portraitSearchInput.value = e.target.value;
                }

                // Re-render content with search filter
                renderContent();
            });

            // Also handle Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                }
            });

            // Portrait search
            const portraitSearchInput = document.getElementById('portraitSearchInput');
            const portraitSearchClear = document.getElementById('portraitSearchClear');

            if (portraitSearchInput) {
                portraitSearchInput.addEventListener('input', (e) => {
                    searchQuery = e.target.value.trim().toLowerCase();

                    // Show/hide clear button
                    if (searchQuery) {
                        portraitSearchClear.classList.add('visible');
                    } else {
                        portraitSearchClear.classList.remove('visible');
                    }

                    // Also update desktop search
                    if (searchInput) {
                        searchInput.value = e.target.value;
                    }

                    // Re-render content with search filter
                    renderContent();
                });
            }
        }

        function clearSearch() {
            const searchInput = document.getElementById('searchInput');
            const searchClear = document.getElementById('searchClear');
            searchInput.value = '';
            searchClear.classList.remove('visible');
            searchQuery = '';

            // Also clear portrait search
            const portraitSearchInput = document.getElementById('portraitSearchInput');
            const portraitSearchClear = document.getElementById('portraitSearchClear');
            if (portraitSearchInput) portraitSearchInput.value = '';
            if (portraitSearchClear) portraitSearchClear.classList.remove('visible');

            renderContent();
        }

        function clearPortraitSearch() {
            clearSearch();
        }

        // Filter songs based on search query
        function getFilteredSongs() {
            if (!searchQuery) return songs;

            return songs.filter(song => {
                const title = cleanTitle(song.title).toLowerCase();
                const artist = (song.artist || '').toLowerCase();
                return title.includes(searchQuery) || artist.includes(searchQuery);
            });
        }

        // Render search results or home content
        function renderContent() {
            const path = window.location.pathname;

            if (path === '/song/list') {
                mainContent.innerHTML = renderSongList();
            } else {
                mainContent.innerHTML = renderHome();
            }
        }

        // Render search results view
        function renderSearchResults() {
            const filteredSongs = getFilteredSongs();

            if (!searchQuery) {
                return renderHome();
            }

            if (filteredSongs.length === 0) {
                return \`
                    <div class="search-results-header">
                        <h1>Search Results</h1>
                        <p class="search-results-count">No songs found for "\${searchQuery}"</p>
                    </div>
                    <div class="no-results">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <h3>No results found</h3>
                        <p>Try searching with different keywords</p>
                    </div>
                \`;
            }

            return \`
                <div class="search-results-header">
                    <h1>Search Results</h1>
                    <p class="search-results-count">Found \${filteredSongs.length} song\${filteredSongs.length !== 1 ? 's' : ''} for "\${searchQuery}"</p>
                </div>
                <div class="song-grid">
                    \${filteredSongs.map((song, index) => \`
                        <div class="song-card" onclick="playSong(\${songs.indexOf(song)})">
                            <div class="album-art">
                                \${song.art ? \`<img src="/api/art/\${song.id}" alt="Album Art">\` : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>'}
                                <button class="play-btn">
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                </button>
                            </div>
                            <div class="song-title">\${cleanTitle(song.title)}</div>
                            <div class="song-artist">\${song.artist || 'Unknown Artist'}</div>
                        </div>
                    \`).join('')}
                </div>
            \`;
        }

        // Modified renderHome to include search results
        function renderHome() {
            // If there's a search query, show search results
            if (searchQuery) {
                return renderSearchResults();
            }

            return renderHomeContent();
        }
        
        // Separate home content renderer for reuse with infinite scroll
        function renderHomeContent() {
            const filteredSongs = getFilteredSongs();
            
            const html = `
                <div class="hero">
                    <h1>Welcome to Funtify</h1>
                    <p>Listen to your favorite music. Upload songs via Telegram Bot @FuntifyMusicBot</p>
                    <div style="margin-top: 20px;">
                        <a href="https://t.me/LLCteamcorp?direct" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 8px; background: var(--accent); color: #000; padding: 12px 24px; border-radius: 500px; text-decoration: none; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 4px 20px rgba(59, 130, 246, 0.4)'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none'">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
                            Request a Song
                        </a>
                    </div>
                </div>

                ${renderPlaylists()}

                <section class="section">
                    <div class="section-header">
                        <h2 class="section-title">Recently Added</h2>
                        <a href="/song/list" class="see-all" id="seeAllLink" onclick="handleSeeAllClick(event)">See all (${songs.length} songs)</a>
                    </div>
                    <div class="song-grid" id="recentlyAddedGrid">
                        ${filteredSongs.slice(0, 20).map((song, index) => `
                            <div class="song-card" onclick="playSong(${songs.indexOf(song)})">
                                <div class="album-art">
                                    ${song.art ? `<img src="/api/art/${song.id}" alt="Album Art">` : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>'}
                                    <button class="play-btn">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                    </button>
                                </div>
                                <div class="song-title">${cleanTitle(song.title)}</div>
                                <div class="song-artist">${song.artist || 'Unknown Artist'}</div>
                            </div>
                        `).join('')}
                    </div>
                    ${hasMoreSongs && !searchQuery ? '<div id="loadingMoreIndicator" style="display:none;text-align:center;padding:20px;color:var(--text-secondary);">Loading more...</div>' : ''}
                </section>

                <section class="section">
                    <div class="section-header">
                        <h2 class="section-title">Your Library</h2>
                    </div>
                    <div class="song-grid">
                        ${filteredSongs.slice(0, 4).map((song, index) => `
                            <div class="song-card" onclick="playSong(${songs.indexOf(song)})">
                                <div class="album-art">
                                    ${song.art ? `<img src="/api/art/${song.id}" alt="Album Art">` : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>'}
                                    <button class="play-btn">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                    </button>
                                </div>
                                <div class="song-title">${cleanTitle(song.title)}</div>
                                <div class="song-artist">${song.artist || 'Unknown Artist'}</div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
            
            // Set up infinite scroll after rendering
            setTimeout(() => {
                setupHomePageScroll();
            }, 100);
            
            return html;
        }

        // Handle "See all" click with loading text
        function handleSeeAllClick(event) {
            event.preventDefault();
            const seeAllLink = document.getElementById('seeAllLink');

            if (seeAllLink) {
                seeAllLink.textContent = 'loading...';
                seeAllLink.classList.add('loading');
            }

            // Navigate after a brief delay to show loading text
            setTimeout(() => {
                history.pushState(null, '', '/song/list');
                router();
            }, 500);
        }

        // Modified renderSongList to include search
        function renderSongList() {
            const filteredSongs = getFilteredSongs();

            return \`
                <div class="song-list-container">
                    <div class="song-list-header">
                        \${searchQuery ? \`
                            <div class="search-results-header" style="margin: 0;">
                                <h1>Search Results</h1>
                                <p class="search-results-count">\${filteredSongs.length} song\${filteredSongs.length !== 1 ? 's' : ''} found</p>
                            </div>
                        \` : \`
                            <h1>Your Library</h1>
                            <p style="color: var(--text-secondary); font-size: 14px;">\${songs.length} songs loaded</p>
                        \`}
                        <span class="info-badge">Upload via Telegram Bot</span>
                    </div>

                    \${filteredSongs.length === 0 ? \`
                        <div class="no-results">
                            \${searchQuery ? \`
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                </svg>
                                <h3>No results found</h3>
                                <p>Try searching with different keywords</p>
                            \` : \`
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style="margin-bottom: 16px;"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                                <p>No songs yet</p>
                                <p style="font-size: 14px; margin-top: 8px;">Upload songs via Telegram Bot @FuntifyMusicBot</p>
                            \`}
                        </div>
                    \` : \`
                        <table class="song-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Title</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody id="songTableBody">
                                \${filteredSongs.map((song, index) => \`
                                    <tr onclick="playSong(\${songs.indexOf(song)})">
                                        <td>\${index + 1}</td>
                                        <td>
                                            <div class="title-cell">
                                                <div class="art">
                                                    \${song.art ? \`<img src="/api/art/\${song.id}" width="40" height="40">\` : ''}
                                                </div>
                                                <div>
                                                    <div style="font-weight: 500;">\${cleanTitle(song.title)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>\${formatDuration(song.duration)}</td>
                                    </tr>
                                \`).join('')}
                            </tbody>
                        </table>
                        \${hasMoreSongs && !searchQuery ? '<div id="loadingMoreIndicator" style="display:none;text-align:center;padding:20px;color:var(--text-secondary);">Loading more songs...</div>' : ''}
                    \`}
                </div>
            \`;
        }

        // Format duration
        function formatDuration(seconds) {
            if (!seconds) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return \`\${mins}:\${secs.toString().padStart(2, '0')}\`;
        }

        // Play song
        function playSong(index) {
            if (index < 0 || index >= songs.length) return;

            currentSongIndex = index;
            const song = songs[index];

            audioPlayer.src = \`/api/stream/\${song.id}\`;
            audioPlayer.play();
            isPlaying = true;

            playerTitle.textContent = cleanTitle(song.title);
            playerArtist.style.display = 'none';

            if (song.art) {
                playerArt.innerHTML = \`<img src="/api/art/\${song.id}" width="56" height="56">\`;
            } else {
                playerArt.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
            }

            updatePlayButton();
        }

        // Toggle play/pause
        function togglePlay() {
            if (currentSongIndex === -1 && songs.length > 0) {
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

        // Update play button
        function updatePlayButton() {
            if (isPlaying) {
                playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
            } else {
                playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
            }
        }

        // Update progress
        audioPlayer.addEventListener('timeupdate', () => {
            if (audioPlayer.duration) {
                const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressFill.style.width = progress + '%';
                currentTimeEl.textContent = formatDuration(audioPlayer.currentTime);
            }
        });

        // Update total time
        audioPlayer.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = formatDuration(audioPlayer.duration);
        });

        // Progress bar click
        progressBar.addEventListener('click', (e) => {
            if (!audioPlayer.duration) return;
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audioPlayer.currentTime = percent * audioPlayer.duration;
        });

        // Volume control
        volumeSlider.addEventListener('input', (e) => {
            audioPlayer.volume = e.target.value / 100;
        });

        // Next song
        document.getElementById('nextBtn').addEventListener('click', () => {
            if (currentSongIndex < songs.length - 1) {
                playSong(currentSongIndex + 1);
            }
        });

        // Previous song
        document.getElementById('prevBtn').addEventListener('click', () => {
            if (currentSongIndex > 0) {
                playSong(currentSongIndex - 1);
            }
        });

        // Play/Pause button
        playPauseBtn.addEventListener('click', togglePlay);

        // Auto play next song
        audioPlayer.addEventListener('ended', () => {
            if (currentSongIndex < songs.length - 1) {
                playSong(currentSongIndex + 1);
            }
        });

        // Router
        async function router() {
            const path = window.location.pathname;

            // Reset pagination state on navigation
            currentPage = 0;
            hasMoreSongs = true;
            
            await loadSongs(0);
            await loadPlaylists();

            if (path === '/song/list') {
                mainContent.innerHTML = renderSongList();
                setupInfiniteScroll();
            } else {
                mainContent.innerHTML = renderHomeContent();
            }

            // Hide loading overlay after content loads
            hideLoading();
        }
        
        // Setup infinite scroll on home page
        function setupHomePageScroll() {
            const loadingIndicator = document.getElementById('loadingMoreIndicator');
            if (!loadingIndicator || !hasMoreSongs || searchQuery) return;
            
            if (!songListObserver) {
                songListObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !isLoadingMore && hasMoreSongs && !searchQuery) {
                            loadMoreSongs();
                        }
                    });
                }, { rootMargin: '200px' });
            }
            
            songListObserver.observe(loadingIndicator);
        }

        // Initialize
        function init() {
            // Start loading text animation
            startLoadingText();

            // Set up search functionality
            setupSearch();

            // Initialize orientation detection
            initOrientationDetection();

            // Initialize live viewer count
            initLiveViewerCount();

            // Start router
            router();
        }

        init();

        // Handle browser back/forward
        window.addEventListener('popstate', router);

        // Handle link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && link.href.startsWith(window.location.origin)) {
                e.preventDefault();
                history.pushState(null, '', link.href);
                router();
            }
        });

        // Disable right-click on audio
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'AUDIO' || e.target.closest('audio')) {
                e.preventDefault();
            }
        });
    </script>
</body>
</html>
`;

// Admin page HTML
const ADMIN_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Funtify</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #0a0a1a;
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .admin-container {
            max-width: 500px;
            width: 100%;
            padding: 40px;
            background: #12122a;
            border-radius: 16px;
            text-align: center;
            border: 1px solid #1e1e3f;
        }

        .admin-container h1 {
            font-size: 32px;
            margin-bottom: 24px;
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .admin-container p {
            color: #94a3b8;
            margin-bottom: 24px;
        }

        .admin-password-input {
            width: 100%;
            padding: 16px;
            border: 2px solid #1e1e3f;
            border-radius: 8px;
            background: #1e1e3f;
            color: #ffffff;
            font-size: 16px;
            margin-bottom: 16px;
            transition: border-color 0.3s;
            outline: none;
        }

        .admin-password-input:focus {
            border-color: #3b82f6;
        }

        .admin-submit-btn {
            width: 100%;
            padding: 16px;
            background: #3b82f6;
            border: none;
            border-radius: 8px;
            color: #000;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s, background 0.2s;
        }

        .admin-submit-btn:hover {
            transform: scale(1.02);
            background: #60a5fa;
        }

        .admin-error {
            color: #ef4444;
            margin-top: 16px;
            display: none;
        }

        .admin-error.visible {
            display: block;
        }

        .admin-dashboard {
            display: none;
        }

        .admin-dashboard.active {
            display: block;
        }

        .admin-stat {
            display: flex;
            justify-content: space-between;
            padding: 16px;
            background: #1e1e3f;
            border-radius: 8px;
            margin-bottom: 12px;
        }

        .admin-stat-label {
            color: #94a3b8;
        }

        .admin-stat-value {
            font-weight: bold;
            color: #3b82f6;
        }

        .admin-back-btn {
            display: inline-block;
            margin-top: 24px;
            padding: 12px 24px;
            background: transparent;
            border: 1px solid #3b82f6;
            border-radius: 500px;
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s;
        }

        .admin-back-btn:hover {
            background: #3b82f6;
            color: #000;
        }
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
        <div class="admin-stat">
            <span class="admin-stat-label">Total Songs</span>
            <span class="admin-stat-value" id="totalSongs">-</span>
        </div>
        <div class="admin-stat">
            <span class="admin-stat-label">Total Playlists</span>
            <span class="admin-stat-value" id="totalPlaylists">-</span>
        </div>
        <div class="admin-stat">
            <span class="admin-stat-label">Current Viewers</span>
            <span class="admin-stat-value" id="currentViewers">-</span>
        </div>
        <a href="/" class="admin-back-btn">Back to Funtify</a>
    </div>

    <script>
        const ADMIN_PASSWORD = 'LLCstaff2026';

        function handleAdminLogin(event) {
            event.preventDefault();
            const password = document.getElementById('adminPassword').value;
            const errorEl = document.getElementById('adminError');

            if (password === ADMIN_PASSWORD) {
                // Show dashboard
                document.getElementById('adminLogin').style.display = 'none';
                document.getElementById('adminDashboard').classList.add('active');

                // Load stats
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

                // Get real viewer count from API
                try {
                    const usersRes = await fetch('/api/users/count');
                    const usersData = await usersRes.json();
                    document.getElementById('currentViewers').textContent = usersData.activeUsers || 0;
                } catch (e) {
                    document.getElementById('currentViewers').textContent = '0';
                }
            } catch (error) {
                console.error('Error loading admin stats:', error);
            }
        }
    </script>
</body>
</html>
`;

// Cloudflare Worker Environment
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const query = url.search;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Admin route - serve admin page
    if (path === '/2026/whatisthis' || path === '/2026/whatisthis?') {
      return new Response(ADMIN_HTML, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

      // User session tracking - heartbeat to track active users
      if (path === '/api/users/heartbeat' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { userId, isPlaying, currentSongId, timestamp } = body;
          
          if (!userId) {
            return new Response(JSON.stringify({ error: 'Missing userId' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Store user session with timestamp
          const sessionData = {
            userId,
            isPlaying: isPlaying || false,
            currentSongId: currentSongId || null,
            lastSeen: timestamp || Date.now(),
            joinedAt: timestamp || Date.now()
          };
          
          await env.FUNTIFY_KV.put(`user:${userId}`, JSON.stringify(sessionData), { expirationTtl: 300 }); // 5 min expiry
          
          // Count all active users (sessions less than 2 minutes old)
          const now = Date.now();
          const twoMinutesAgo = now - 120000;
          let activeUsers = 0;
          
          try {
            const userList = await env.FUNTIFY_KV.list({ prefix: 'user:' });
            for (const key of userList.keys) {
              if (key.name.startsWith('user:')) {
                const sessionRaw = await env.FUNTIFY_KV.get(key.name);
                if (sessionRaw) {
                  const session = JSON.parse(sessionRaw);
                  if (session.lastSeen && session.lastSeen > twoMinutesAgo) {
                    activeUsers++;
                  }
                }
              }
            }
          } catch (e) {
            console.error('Error counting active users:', e);
          }
          
          return new Response(JSON.stringify({ 
            success: true, 
            activeUsers: activeUsers 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Error in heartbeat:', error);
          return new Response(JSON.stringify({ error: 'Internal error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // User unregister endpoint
      if (path === '/api/users/unregister' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { userId } = body;
          
          if (userId) {
            await env.FUNTIFY_KV.delete(`user:${userId}`);
          }
          
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          return new Response(JSON.stringify({ success: false }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Get current active users count
      if (path === '/api/users/count' && request.method === 'GET') {
        const now = Date.now();
        const twoMinutesAgo = now - 120000;
        let activeUsers = 0;
        
        try {
          const userList = await env.FUNTIFY_KV.list({ prefix: 'user:' });
          for (const key of userList.keys) {
            if (key.name.startsWith('user:')) {
              const sessionRaw = await env.FUNTIFY_KV.get(key.name);
              if (sessionRaw) {
                const session = JSON.parse(sessionRaw);
                if (session.lastSeen && session.lastSeen > twoMinutesAgo) {
                  activeUsers++;
                }
              }
            }
          }
        } catch (e) {
          console.error('Error counting active users:', e);
        }
        
        return new Response(JSON.stringify({ activeUsers }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    try {
      // API Routes
      if (path === '/api/songs') {
        // Get all songs metadata from both worker patterns with pagination
        const urlParams = new URL(request.url).searchParams;
        const page = parseInt(urlParams.get('page')) || 0;
        const limit = parseInt(urlParams.get('limit')) || 50;
        
        const songs = [];

        try {
          // Pattern 1: From funtibot.txt (song:meta:)
          const botList = await env.FUNTIFY_KV.list({ prefix: 'song:meta:' });

          for (const key of botList.keys) {
            const metadata = await env.FUNTIFY_KV.get(key.name);
            if (metadata) {
              const meta = JSON.parse(metadata);
              // Normalize format for web interface
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
          // Pattern 2: From worker.txt (metadata:)
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

        // Sort by date added (newest first)
        songs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Apply pagination
        const startIndex = page * limit;
        const endIndex = startIndex + limit;
        const paginatedSongs = songs.slice(startIndex, endIndex);

        return new Response(JSON.stringify(paginatedSongs), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/stream/')) {
        // Stream audio file - check both patterns
        const songId = path.split('/').pop();

        // Try funtibot pattern first (song:data:)
        let audioData = await env.FUNTIFY_KV.get(`song:data:${songId}`, { type: 'arrayBuffer' });
        let contentType = 'audio/mpeg';

        // Try worker pattern (audio:)
        if (!audioData) {
          audioData = await env.FUNTIFY_KV.get(`audio:${songId}`, { type: 'arrayBuffer' });
        }

        if (!audioData) {
          return new Response('Audio not found', { status: 404 });
        }

        // Support range requests for seeking
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
              'Content-Range': `bytes ${start}-${end}/${audioData.byteLength}`,
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
        // Get album art - check both patterns
        const songId = path.split('/').pop();

        // Try worker pattern first (art:)
        let artData = await env.FUNTIFY_KV.get(`art:${songId}`);

        // Try bot pattern if not found
        if (!artData) {
          const metaRaw = await env.FUNTIFY_KV.get(`song:meta:${songId}`);
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

      // Bot API endpoint for uploading songs (only for funtibot.txt)
      if (path === '/api/bot/upload' && request.method === 'POST') {
        const body = await request.json();
        const { songId, audioData, metadata, artData } = body;

        if (!songId || !audioData || !metadata) {
          return new Response(JSON.stringify({ error: 'Missing data' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Store audio using funtibot pattern
        const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0)).buffer;

        await env.FUNTIFY_KV.put(`song:meta:${songId}`, JSON.stringify(metadata));
        await env.FUNTIFY_KV.put(`song:data:${songId}`, audioBuffer);

        // Store art if provided
        if (artData) {
          const artBuffer = Uint8Array.from(atob(artData), c => c.charCodeAt(0)).buffer;
          await env.FUNTIFY_KV.put(`song:art:${songId}`, artBuffer);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Debug endpoint - list all KV keys
      if (path === '/api/debug/keys' && request.method === 'GET') {
        const allKeys = await env.FUNTIFY_KV.list();
        return new Response(JSON.stringify(allKeys.keys.map(k => k.name)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Playlist API endpoints
      if (path === '/api/playlists') {
        // Get all playlists
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

        // Create new playlist
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
          await env.FUNTIFY_KV.put(`playlist:${id}`, JSON.stringify(playlist));

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update playlist
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
          await env.FUNTIFY_KV.put(`playlist:${id}`, JSON.stringify(playlist));

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Serve HTML for all other routes
      return new Response(HTML, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
