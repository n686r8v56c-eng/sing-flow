# Vocal Flow — React + Vite + Supabase + Cloudflare Pages

## Setup
1. Run `npm install` and `npm run dev`.
2. Create a Supabase project. In its SQL editor, run `supabase/schema.sql` (creates only new namespaced table/bucket; does not reset existing app data).
3. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable key). Do **not** use a service role key in the browser.
4. Under Supabase Authentication > URL Configuration, set Site URL to the Cloudflare Pages address, and add the preview URL to allowed redirects. Under Providers > Email, configure email confirmation as desired.
5. Cloudflare Pages: connect GitHub repo, Framework preset `Vite`, Build command `npm run build`, Output `dist`, environment variables the same as above. Node 20+ recommended.

## Design & data
- Mobile-first Focus Flow-like compact UI, one shared modal component, five bottom tabs.
- `vocal_profiles.app_data` stores per-user songs, classifications, bookmarks, KPI and recording metadata with RLS.
- Audio stored in private Supabase Storage bucket `vocal-media`; signed URLs used for playback. 50 MiB object limit. Files may require resubmission if too large. In guest mode data/audio is stored in current browser (base64 localStorage; short tests only).
- Existing standalone HTML's localStorage and IndexedDB are **not automatically migrated**. Export/import of this version's metadata JSON is available; binary media is not included in JSON.
- In the current version, A–B loop works with uploaded tracks. YouTube is reference viewing, without direct audio capture or waveform analysis. Karaoke MR and vocal are not combined/exported.
- Training bookmark classification follows the training item's category/subcategory. No separate duplicate category mapping.
- A/B recording comparison is manual playback of two selected clips; no algorithmic pitch scoring.
- The app currently saves a whole JSON document per user (single-device edits expected). Concurrent multi-device edits can overwrite each other; for robust collaboration adopt normalized tables and conflict handling.
- Deleting a log removes metadata only, not stored media; for clean-up, implement authenticated Storage remove after verifying ownership.

## Validation
Run `npm run build` after dependency installation. Browser-based mic, iPhone Safari, Supabase credential verification, Storage policies and Cloudflare build should be tested with a real project and HTTPS origin.
