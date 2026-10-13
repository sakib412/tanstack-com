/** The Worker bindings this site reads (all platform-provided; see AGENTS.md). */
declare module 'cloudflare:workers' {
  export const env: {
    /** The Site Database. Empty until the owner enables it. Server only. */
    DATABASE_URL?: string;
    EZY_COMMUNITY_KEY?: string;
    EZY_SITE_URL?: string;
  };
}
