# Sundar Gutka

This repository is the Progressive Web App (PWA) version of [sundar-gutka-react](https://github.com/KhalisFoundation/sundar-gutka-react). It is designed to be fully installable, offline-first, and run with a local SQLite database using WebAssembly (`sql.js`).

## Features

- **Offline Support**: Fully functional offline using service workers.
- **Local SQLite DB**: Uses WebAssembly-based SQLite (`sql.js`) to query Gurbani text from a local database (`gutka_v01.db`).
- **Responsive Design**: Mobile-friendly and customizable reading experience.
- **Installable**: Can be installed on iOS, Android, and desktop browsers as a standalone PWA.

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (version 18 or later is recommended).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/KhalisFoundation/sundar-gutka-pwa.git
   cd sundar-gutka-pwa
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the local development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
By default, the application will be available at `http://localhost:5173`.

### Production Build

To compile and optimize the application for production deployment:
```bash
npm run build
```
This will generate the build files in the `dist/` directory.

### Preview Production Build

To preview the production build locally before deploying:
```bash
npm run preview
```

### Linting

To run ESLint and check for code style issues:
```bash
npm run lint
```

## Deployment

Since this app is a fully static client-side application (using WebAssembly to run SQLite in the browser), it **does not require a Node.js server in production**.

You can deploy the build outputs (from the `dist/` directory) to any static hosting provider, including:
- **AWS S3 + CloudFront CDN**
- **Cloudflare Pages**
- **Vercel**
- **Netlify**
- **Firebase Hosting**
- **GitHub Pages**

### CDN Configuration Recommendations

- **Cache-Control for Database**: The SQLite database file (`public/gutka_v01.db`) is relatively large (~67MB). It is highly recommended to configure your CDN to cache this file aggressively with a long TTL (e.g., `Cache-Control: public, max-age=31536000, immutable`), and let the service worker cache it on the user's device for subsequent visits.
- **WASM Support**: Ensure that the server serves `.wasm` files with the correct MIME type: `application/wasm`.

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **Database**: SQLite via `sql.js` (WebAssembly worker)
- **Icons**: Lucide React
- **PWA Capabilities**: Service Workers (`sw.js`) and Web App Manifest (`manifest.json`)
