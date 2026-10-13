import {existsSync} from 'node:fs';

import {cloudflare} from '@cloudflare/vite-plugin';
import {tanstackStart} from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

// Cloudflare's plugin turns the SSR build into a real Worker and emits the
// deployed config (dist/server/wrangler.json). It needs a wrangler config to do
// either — and this repo deliberately commits none: the PLATFORM writes one at
// build time (ADR-0001), so the deploy config can never be broken by editing a
// committed file.
//
// Hence the guard. With a config present (the Go Live build) the plugin is
// active and the output is a Worker. Without one (the IDE Preview, where the
// platform writes nothing) the plugin is left OUT entirely — enabling it there
// gives it no Worker to route to and EVERY request 404s, which would break the
// live Preview. Plain Vite SSR serves the dev server instead, as it does today.
//
// A build that somehow runs without the config degrades to a Node server rather
// than a Worker; Deploy catches that loudly ("Build produced no
// server/wrangler.json") instead of shipping the wrong shape.
const hasWranglerConfig =
  existsSync('./wrangler.jsonc') ||
  existsSync('./wrangler.json') ||
  existsSync('./wrangler.toml');

export default defineConfig({
  // Order: Cloudflare (when active) first, then Start, then React.
  plugins: [
    ...(hasWranglerConfig ? [cloudflare({viteEnvironment: {name: 'ssr'}})] : []),
    tanstackStart({
      // TanStack Router's generator writes its placeholder route (`Hello "/"!`)
      // into any route file it reads as EMPTY. An editor that saves in place
      // (truncate, then write) is empty for a moment, so the generator could
      // replace your code with the placeholder. An empty template makes it
      // leave empty route files alone; a new route file starts empty instead
      // of scaffolded. (The root route ignores this option.)
      router: {customScaffolding: {routeTemplate: ''}},
    }),
    viteReact(),
  ],
  server: {
    // The Preview reaches the dev server through an authenticated proxy on a
    // different host, so bind wide and accept the forwarded Host header.
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: true,
  },
});
