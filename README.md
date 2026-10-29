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
