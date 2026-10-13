interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: 'live' | 'snapshot'
  readonly VITE_BWF_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
