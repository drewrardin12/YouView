# YouView

Your YouTube. Your channels. Nothing else.

A free GitHub Pages edition of a personal approved-channel YouTube browser. Open index.html through GitHub Pages. Settings accepts a personal browser-restricted YouTube Data API key, held in session storage and sent directly to Google. No keys belong in Git commits, README text, query parameters to this site, or GitHub Pages files. Restrict your key to the YouTube Data API and the actual Pages origin using Google Cloud’s website restrictions.

## Features
34 verified permanent channel IDs from the 36 approved names; local IndexedDB progress/history; automatic resume; less-than-three-minutes completion; persistent visible in-app player; ±10 second seeking; share YouTube URLs; per-channel older-upload pagination; first 50 playlist items and allowlist-restricted sequential playback; channel counters; watch-frequency sorting; backup export/import; chapter extraction using IrishWeegee’s verified permanent channel ID.

## Limits
LeBron James and Fat Perez require exact URLs to disambiguate. Shorts identification/swiping, exhaustive live discovery, playlist pagination, automatic cloud sync, and raster iPhone icon packaging remain incomplete. Search covers loaded metadata; load older uploads on channel pages to extend it. Comment scans check up to 500 top-level comments and do not guarantee finding the desired comment. Browser storage can be cleared; export backups. Actual iPhone playback has not been tested yet. Made-for-kids or unknown-status videos are not tracked.

YouTube’s official player controls, branding, links, and related videos remain intact. No background player, stream extraction, audio extraction, download, or recommendation masking. Open in YouTube hands playback to the official service for supported Premium/background/PiP behavior; progress there cannot sync back.

## Hosting
GitHub Pages: main branch, root directory. No build step, dependencies, or paid backend. All app logic lives in index.html; icon.svg and manifest.webmanifest are companion assets.
