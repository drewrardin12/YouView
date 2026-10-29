# Cross-device sync provisioning — not activated

The public GitHub Pages app currently remains local-first. No viewing history has been uploaded.

schema.sql prepares authenticated, per-user storage for a Supabase project. Row-level security isolates accounts; writes use compare-and-swap revisions to reject conflicting device snapshots instead of silently replacing newer data. Only viewing records and channel preferences are accepted, with a 2 MB limit. The YouTube key and indexed video catalogue are excluded.

Required before enabling: provision an owner-controlled Supabase project, apply the SQL, configure authentication and the GitHub Pages redirect URL, then integrate and test authenticated local-first reconciliation including channel/history deletion tombstones. A project URL and publishable key can be shipped; service-role credentials must never be included.

This schema is preparatory source, not a working sync feature. It has not been run against a live Postgres instance. No paid services or cloud accounts were created.
