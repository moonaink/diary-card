# Local-Only Installable Web App

Status: Active

## Context

The app is a personal DBT diary card for one person who uses an iPhone. The records are sensitive (urges to suicide
and self-harm, substance use), and the owner wants them stored only on the phone. The owner writes code through AI
agents and has a Windows computer, no Mac.

## Decision

The app is a static web application installed to the iPhone home screen (a progressive web app):

- there is no backend; the hosting serves only the built files of the app;
- all records and settings are stored in the browser storage (IndexedDB) of the installed app on the phone;
- the PDF and the backup file are generated on the phone;
- the app is hosted on GitHub Pages from a public repository; a push to `main` builds and publishes it through
  `.github/workflows/deploy.yml`.

## Consequences

- The records live in the storage of the home-screen app. Removing the icon removes them, and a Safari tab of the same
  address has a separate storage. The owner fills the card only from the icon, and the app must offer backup and
  restore (see [ProductOverview.md](../Overview/ProductOverview.md) `## Backup`).
- Safari may clear the storage of websites that are not in use; a home-screen web app counts its own days of use, so
  its storage is not expected to be cleared while the app is used. The app asks for persistent storage at start
  (`requestPersistentStorage()`); the backup remains the protection against loss.
- Every library has to work in the browser and offline. Generating a PDF with Russian text on the phone needs a font
  with Cyrillic glyphs bundled with the app ([CardPdf.md](../Systems/CardPdf.md)), and every file the app uses must
  be cached by the service worker ([OfflineApp.md](../Systems/OfflineApp.md)).
- A feature that needs a server (push reminders, sync between devices, sharing with the therapist through a link)
  is outside this decision and needs a new architecture decision document.
- The repository is public: code, documents and any images added to it are visible to anyone; the records never
  reach it.
- GitHub Pages serves the app under the repository name, so `base` in `vite.config.ts` equals `/<repository>/`.
  Renaming the repository requires changing `base`, or every asset URL breaks.
- Pages publishes over HTTPS, which installation to the home screen and offline work require.

## Alternatives considered

- Cloudflare Pages or Netlify with a private repository: also free, and the code would not be public. The owner chose
  GitHub Pages.
- A native iOS app: needs macOS with Xcode and Apple code signing to install on the phone; not available.
