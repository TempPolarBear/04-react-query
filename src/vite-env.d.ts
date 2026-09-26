/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly TMDB_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
