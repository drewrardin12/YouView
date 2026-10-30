# YouView native iPhone PiP test project — UNVERIFIED

Open YouView.xcodeproj in Xcode, choose your personal signing team, choose a connected iPhone, and run. No Apple subscription or purchase has been configured. Apple personal-team signing requires periodic rebuilding/reinstallation (normally seven days).

This is a WKWebView app, not a Home Screen PWA. It explicitly enables native Picture-in-Picture and AirPlay, uses persistent local web storage and the live YouView website, and retains official YouTube playback. It has no stream extraction, injected player bypass, hidden background player, or special background-audio entitlement. Browsing and loading within YouView remain restricted by the website's channel allowlist; deliberate external links use the system browser. Home opens on a new launch.

Xcode is not installed in the current environment. The project has NOT been compiled or run on an iPhone. PiP/AirPlay are not confirmed. A WKWebView setting enables eligibility, not guaranteed content support. If YouTube or WebKit still rejects PiP, this prototype does not solve it. No App Store release, TestFlight build, raster icon package, or device installation exists yet.

Native web storage is separate from Safari/Home Screen storage: reconnect the restricted YouTube API key in Settings and configure the same private sync account once a backend is provisioned. Never embed a YouTube key or service key into the native source. This prototype's export/download handling also needs native validation before relying on it for backups.
