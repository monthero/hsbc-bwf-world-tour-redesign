import type { CSSProperties } from 'react';

import type { Focus, PhotoCrop } from '~/types';

const IMG = 'https://img.bwfbadminton.com/image/upload/';

export const tournamentLogoUrl = (code: string, version: string) =>
  `${IMG}v${version}/assets/tournaments/logo/${code}.png`;

export const tournamentHeaderUrl = (code: string, version: string, shape: 'wide' | 'square' = 'wide') =>
  `${IMG}t_Fansite_Tournament_Card_Header_${shape === 'wide' ? 'Wide' : 'Squared'}/v${version}/assets/tournaments/header/${code}.png`;

export const localAsset = (path: string) => `${import.meta.env.BASE_URL}${path.slice(1)}`;

export const playerThumbUrl = (photo: string | undefined | null) => {
  if (!photo || /profile_(fe)?male/.test(photo)) return '';
  if (photo.startsWith('http')) return photo;
  if (photo.startsWith('/')) return localAsset(photo);
  const [ver, file = ''] = photo.split('/');
  return `${IMG}${ver}/assets/players/thumbnail/${file.replace(/\.tiff?$/i, '.jpg')}`;
};

export const playerSquareUrl = (thumbUrl: string, size = 420) =>
  thumbUrl ? thumbUrl.replace('/image/upload/', `/image/upload/c_fill,g_face,z_0.75,w_${size},h_${size}/`) : '';

const HERO_CROP = { mobile: 'c_fill,w_780,h_700,g_face,z_0.75', desktop: 'c_fill,w_1000,h_480,g_face,z_0.7' };
const HERO_FULL = { mobile: 'c_limit,w_1000', desktop: 'c_limit,w_2000' };

export const playerHeroSourceUrl = (bwfId: string, version: string, width: number) =>
  `${IMG}c_limit,w_${width}/${version}/assets/players/hero/${bwfId}.jpg`;

export const playerHeroUrl = (bwfId: string, version: string, mobile: boolean, full = false) => {
  if (version.startsWith('http')) return version;
  if (version.startsWith('/')) return localAsset(version);
  const shape = mobile ? 'mobile' : 'desktop';
  return `${IMG}${(full ? HERO_FULL : HERO_CROP)[shape]}/${version}/assets/players/hero/${bwfId}.jpg`;
};

const focusPos = (focus: Focus) => `${focus.x}% ${focus.y}%`;

export const heroVars = (src: string, focus: Focus | null | undefined) =>
  ({ '--hero': `url("${src}")`, ...(focus && { '--hero-pos': focusPos(focus) }) }) as CSSProperties;

export const photoVars = (crop: PhotoCrop | null | undefined) =>
  crop ? ({ '--photo-pos': focusPos(crop), '--photo-zoom': crop.zoom } as CSSProperties) : undefined;
