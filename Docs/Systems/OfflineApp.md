# Offline App

## Summary

Status: Active

How the app is installed on the iPhone home screen and works without internet: the web app manifest, the service
worker that caches every file of the build, the icons and the iOS tags, the update policy, and the GitHub Pages path
prefix. Why the app is built this way is in [LocalOnlyPwa.md](../Decisions/LocalOnlyPwa.md).

## Responsibility

- Describes the app to the browser so that it installs as an icon with its own window.
- Caches the whole app on the first visit so that later launches need no network.
- Brings a published update to the installed app.

## Source of truth

- The `VitePWA` options in `vite.config.ts` are the source of truth for the manifest (name, colors, icons) and for
  which build files the service worker caches.
- `index.html` holds the iOS tags and the `apple-touch-icon` link that Safari reads instead of the manifest icons.
- `base` in `vite.config.ts` is the path prefix of every URL of the app.

## Primary code directory

`vite.config.ts`, with the icons in `public/` and the registration in `src/main.tsx`.

## Key types and files

- `vite.config.ts` — `base`, the `VitePWA` plugin options.
- `index.html` — iOS tags, icons.
- `src/main.tsx` — `registerSW` from `virtual:pwa-register`.
- `public/` — `apple-touch-icon.png`, the two manifest icons, `favicon.svg`.
- `.github/workflows/deploy.yml` — builds and publishes to GitHub Pages on every push to `main`.

## Runtime flow

1. The build generates the service worker with a precache list of every build file that matches the `globPatterns`
   option.
2. On the first visit `registerSW` registers the service worker; it downloads and caches every file of the list.
3. Later launches are served from the cache; a navigation falls back to the cached `index.html`.
4. After a push, the next launch with network finds the new service worker; with `registerType: 'autoUpdate'` it
   activates at once and reloads the page.

## Rules and invariants

- Every file the app needs offline matches the precache patterns: the JS chunks (including the PDF code that loads
  only on export), CSS, HTML, the TTF fonts of the PDF, the WOFF2 files of the interface font, icons and the manifest.
  A new kind of asset must be added to `globPatterns`, or it is missing offline.
- The service worker exists only in the production build; in the dev server `registerSW` does nothing.
- `base` equals `/<repository>/` of GitHub Pages; renaming the repository requires changing it.
- The automatic reload on update loses nothing, because every change on screen is already saved
  ([DailyEntry.md](../Features/DiaryCard/DailyEntry.md)).

## Edge cases

- The very first launch needs network; until the service worker has cached the files, the app does not work offline.
- An update reaches the phone only on a launch with network after the deploy has finished; closing and reopening the
  app applies it.

## Extension notes

- Reminders through push notifications, or sync, need a server and are outside
  [LocalOnlyPwa.md](../Decisions/LocalOnlyPwa.md); they need a new architecture decision document.

## Related features

- [Overview.md](../Features/DiaryCard/Overview.md)
