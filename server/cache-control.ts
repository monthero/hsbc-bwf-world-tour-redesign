export const cdnCache = (sMaxAge: number, staleWhileRevalidate: number, maxAge = 0) =>
  `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

export const IMMUTABLE_CACHE = 'public, max-age=31536000, s-maxage=31536000, immutable';
