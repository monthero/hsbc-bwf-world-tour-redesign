export interface PrerenderPage {
  path: string;
  search: string;
  locale: string;
  locales: readonly string[];
}

export interface RendererOptions {
  origin: string;
  template: string;
  readJson: (file: string) => unknown;
  catalogs: Readonly<Record<string, Record<string, unknown>>>;
}

export interface Renderer {
  render: (page: PrerenderPage) => string | null;
}

export type CreateRenderer = (options: RendererOptions) => Renderer;

export const RENDER_ENTRY = '/scripts/prerender/render/index.ts';
