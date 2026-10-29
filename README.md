# YouView

Your YouTube. Your channels. Nothing else.

A free GitHub Pages edition of a personal approved-channel YouTube browser. Open index.html through GitHub Pages. Settings accepts a personal browser-restricted YouTube Data API key, held in session storage by default (or remembered in local storage with explicit opt-in) and sent directly to Google. No keys belong in Git commits, README text, query parameters to this site, or GitHub Pages files. Restrict your key to the YouTube Data API and the actual Pages origin using Google Cloud’s website restrictions.

## Features
34 verified permanent channel IDs from the 36 approved names; local IndexedDB progress/history; automatic resume; less-than-three-minutes completion; persistent visible in-app player; ±10 second seeking; share YouTube URLs; per-channel older-upload pagination; first 50 playlist items and allowlist-restricted sequential playback; channel counters; watch-frequency sorting; backup export/import; chapter extraction using IrishWeegee’s verified permanent channel ID.

## Limits
LeBron James and Fat Perez require exact URLs to disambiguate. Shorts identification/swiping, exhaustive live discovery, playlist pagination, automatic cloud sync, and raster iPhone icon packaging remain incomplete. Search covers loaded metadata; load older uploads on channel pages to extend it. Each comment scan checks up to 500 top-level comments; Search more comments continues pagination. A match is not guaranteed. Browser storage can be cleared; export backups. Actual iPhone playback has not been tested yet. Made-for-kids or unknown-status videos are not tracked.

YouTube’s official player controls, branding, links, and related videos remain intact. No background player, stream extraction, audio extraction, download, or recommendation masking. Open in YouTube hands playback to the official service for supported Premium/background/PiP behavior; progress there cannot sync back.

## Hosting
GitHub Pages: main branch, root directory. No build step, dependencies, or paid backend. All app logic lives in index.html; icon.svg and manifest.webmanifest are companion assets.

## Playback reliability
The player now reports loading, blocked autoplay, playback time, errors, and a retry action outside the official iframe. Initialization is guarded against late playback after closing, rapid selection races, and saving a previous video’s time under a new video. Run `node playback.test.mjs` for the lifecycle and progress checks. Desktop Chrome tests verified real playback, skip controls, mini-player navigation, and progress retained across reload; iPhone verification remains pending.

### Full-screen Shorts, counter reset, and live discovery

Short-form selections open in a full-viewport player on desktop and mobile; this does not depend on iOS granting native fullscreen. The update resets upload-counter baselines once per device, preserving watch history and progress. Settings also provides a reset button.

Active streams have a separate Live now section on Home and channel Videos pages. A channel-specific official live search runs on channel entry or from Check live streams; Home prioritizes Le Batard and channels already known live. Results are allowlist-filtered and cached for 15 minutes to conserve quota. This is not exhaustive polling of all approved channels. A connected Data API key is required for live discovery.

### Remembered connection and restricted videos

Settings offers an opt-in Remember key on this device checkbox. A connected session key can be remembered without retyping it by checking the box and clicking Connect. Forget key clears both storage locations. Keys remain excluded from exported backups and source.

Player errors distinguish creator-blocked embeds (101/150), missing client identification (153), and unavailable videos (100). Creator-blocked streams must open on YouTube; YouView does not bypass that restriction.

### Visible timestamp chapters

Le Batard videos now always show a Chapters panel with lookup status and Refresh chapters. The preferred commenter is resolved through YouTube channels.forHandle and matched by permanent author channel ID, never display name. Successful comments are cached for 24 hours; unsuccessful scans for 10 minutes. Search more comments continues beyond each 500-comment batch. API errors and missing connections are visible; description timestamps remain the fallback.

### Older search, full playlists, and native playback controls

Search normalizes punctuation/accents, ranks partial matches, and can progressively index older upload pages from approved channels. Each search checks one older page per relevant channel automatically; Search older uploads continues with up to 500 pages per run and preserves the cursor for another run. Stop indexing pauses it. Channel-specific YouTube search adds historical results with pagination. This is metadata search, not transcript or full semantic search.

Channel playlist lists support further pages. Playlist entries preserve order and duplicates while excluding unavailable or unapproved entries. Load entire playlist and Play playlist follow all remaining pages; playback tracks queue position so repeated video IDs do not loop incorrectly. Leaving the playlist view stops further page loading after the current request.

PiP and casting redirect buttons have been removed at the user’s request. Native embedded-player and browser controls remain available where supported. The official YouTube IFrame API does not expose custom PiP, AirPlay, or Cast methods, so YouView does not present nonfunctional substitutes.

The chapter parser now accepts IrishWeegee’s bracketed start/end ranges and seeks to each range’s start. Existing negative chapter caches are invalidated for the parser update. Paste an approved YouTube video link in search to open it directly; an existing unfinished position takes precedence over a link timestamp.

Regular videos request native iOS fullscreen playback (`playsinline=0`); Shorts retain inline playback (`playsinline=1`). Switching between these modes rebuilds the player while preserving saved progress. Fullscreen and native media controls remain enabled. Actual PiP/AirPlay availability still needs verification on an iPhone.

Simplicity comparison: regular videos now receive a fresh autoplaying embed per selection. The IFrame API attaches for progress tracking without loading the initial video a second time. This follows Simplicity’s initial embed flow while retaining verified progress handling; iPhone native PiP/AirPlay remains unverified.

Version 1.4.2 IPHONE adds an explicit iPhone player option that uses Simplicity’s exact basic embed URL and permissions without the IFrame API. It remains inside YouView and starts from saved progress. Ongoing progress, custom skip buttons, and chapter seeking are unavailable in that mode; Return to tracked player restores those features. Closing removes the iframe to stop playback. Native controls still require verification on iPhone.

Version 1.4.3 LEGACY adds `iphone.html`, generated by `python3 build-iphone.py` from the main app. This uses Simplicity’s manifest-free Apple Home Screen metadata and viewport, preserving normal API-based progress tracking. Settings reports the entry page and detected launch mode. Existing installed icons do not automatically change install identity; test a separate icon created in Safari. This is an installation compatibility test, not confirmed PiP support. Regenerate this entry for every subsequent app change.

Version 1.4.4 CLEAN: verified @lebron against YouTube’s official launch announcement and the channel canonical ID. Fat Perez remains unresolved: his official website links to the already-approved Bob Does Sports channel. Removed the unsuccessful alternate-player buttons and experimental install prompts. The legacy iphone.html URL remains supported for existing Home Screen icons; it uses the same tracked app. No design-handoff work included.

1.4.5 LIVE: selecting a playlist entry loads the remaining pages before starting its ordered queue, with removed channels filtered. Home checks one additional least-recently-checked approved channel per 30 minutes of use, alongside existing live/favorite checks. This broadens discovery with at most two additional search requests per hour; discovery is gradual, not exhaustive real-time polling.
