# Private cross-device sync

## Implemented

The optional GitHub Pages sync client signs into an existing Supabase email/password user, uses the public project key plus authenticated JWT, and reads only that user's row under row-level security. Writes go through compare-and-swap revisions. Per-record last-write-wins reconciliation includes deletion tombstones, progress rewinds, history, channel preferences/visit statistics, and manual Shorts corrections. Concurrent equal timestamps use a deterministic tie break. Channel statistics use the latest per-channel record, not additive totals across concurrent devices. Accurate device clocks are required. No YouTube key or indexed-video catalogue is uploaded.

Local saving remains primary. The sync journal is stored locally per project/account; session tokens are in memory only and never added to exports or source. Sign in again after closing the app. Changes sync after a debounce, on reconnect/foreground, and periodically while visible. Network failures retain local changes for the next attempt. Do not switch accounts if you do not intend to merge the current device's local data into that account. Sign out retains local data.

## Backend setup still required

1. Create an owner-controlled Supabase project, without enabling billing for this task.
2. Execute schema.sql as owner. It creates authenticated per-user state storage with a 2 MB row limit, read isolation, revision-checked writes, and a top-level payload allowlist.
3. Create and confirm a personal email/password Auth user through Supabase's account tools. No signup emails are sent by YouView itself.
4. In YouView Settings, use the HTTPS `your-project.supabase.co` URL, an anon/publishable key, and that user's credentials. Never paste a service-role/secret key. Configure both/all devices with the same project/account.
5. Check actual two-device operation before relying on cloud recovery. Indexed metadata is fetched separately per device, so a synced history entry may need its video metadata loaded before its card appears.

The current environment has no connected Supabase project credentials. No cloud project was created and no viewing data has been uploaded. SQL and live end-to-end authentication have not been tested against a deployed database. core.test.mjs tests reconciliation; client.test.mjs tests the client with a simulated auth/REST service. These do not replace backend security/device tests.
