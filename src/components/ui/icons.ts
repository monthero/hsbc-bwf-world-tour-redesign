import { createElement, type ComponentType, type FC, type SVGProps } from 'react';
import AltArrowDown from '~icons/solar/alt-arrow-down-linear';
import AltArrowLeft from '~icons/solar/alt-arrow-left-linear';
import AltArrowRight from '~icons/solar/alt-arrow-right-linear';
import AltArrowUp from '~icons/solar/alt-arrow-up-linear';
import ArrowRightUp from '~icons/solar/arrow-right-up-linear';
import CalendarLinear from '~icons/solar/calendar-linear';
import CheckLinear from '~icons/solar/check-linear';
import CloseLinear from '~icons/solar/close-linear';
import CupStar from '~icons/solar/cup-star-bold-duotone';
import FireBold from '~icons/solar/fire-bold';
import HamburgerMenu from '~icons/solar/hamburger-menu-linear';
import InfoCircle from '~icons/solar/info-circle-linear';
import Letter from '~icons/solar/letter-linear';
import LinkLinear from '~icons/solar/link-linear';
import MagniferLinear from '~icons/solar/magnifer-linear';
import MapPoint from '~icons/solar/map-point-linear';
import MedalStar from '~icons/solar/medal-star-bold-duotone';
import PlayStream from '~icons/solar/play-stream-linear';
import SettingsLinear from '~icons/solar/settings-linear';
import ShareLinear from '~icons/solar/share-linear';
import StarBold from '~icons/solar/star-bold';
import StarLinear from '~icons/solar/star-linear';
import Stopwatch from '~icons/solar/stopwatch-linear';
import Target from '~icons/solar/target-bold-duotone';
import Tuning from '~icons/solar/tuning-2-linear';
import UserRounded from '~icons/solar/user-rounded-linear';

export type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

const icon =
  (svg: ComponentType<SVGProps<SVGSVGElement>>): FC<IconProps> =>
  ({ size = '1em', ...props }) =>
    createElement(svg, { width: size, height: size, 'aria-hidden': props['aria-label'] ? undefined : true, ...props });

export const IconBack = icon(AltArrowLeft);
export const IconNext = icon(AltArrowRight);
export const IconExpand = icon(AltArrowDown);
export const IconCollapse = icon(AltArrowUp);
export const IconSearch = icon(MagniferLinear);
export const IconClose = icon(CloseLinear);
export const IconCheck = icon(CheckLinear);
export const IconStar = icon(StarLinear);
export const IconStarFilled = icon(StarBold);
export const IconTrophy = icon(CupStar);
export const IconLive = icon(Target);
export const IconMapPin = icon(MapPoint);
export const IconCalendar = icon(CalendarLinear);
export const IconInfo = icon(InfoCircle);
export const IconTimer = icon(Stopwatch);
export const IconProfile = icon(UserRounded);
export const IconFilters = icon(Tuning);
export const IconMedal = icon(MedalStar);
export const IconFire = icon(FireBold);
export const IconExternal = icon(ArrowRightUp);
export const IconMenu = icon(HamburgerMenu);
export const IconNewsletter = icon(Letter);
export const IconShare = icon(ShareLinear);
export const IconLink = icon(LinkLinear);
export const IconStream = icon(PlayStream);
export const IconSettings = icon(SettingsLinear);

const brand =
  (d: string): FC<SVGProps<SVGSVGElement>> =>
  (props) =>
    createElement('svg', { viewBox: '0 0 24 24', fill: 'currentColor', ...props }, createElement('path', { d }));

export const IconFacebook = icon(
  brand(
    'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  ),
);
export const IconX = icon(
  brand(
    'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  ),
);
export const IconInstagram = icon(
  brand(
    'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077',
  ),
);
export const IconYouTube = icon(
  brand(
    'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  ),
);
export const IconWeibo = icon(
  brand(
    'M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.601l.014-.028zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.57-.18-.405-.615.375-.977.42-1.804 0-2.404-.781-1.112-2.915-1.053-5.364-.03 0 0-.766.331-.571-.271.376-1.217.315-2.224-.27-2.809-1.338-1.337-4.869.045-7.888 3.08C1.309 10.87 0 13.273 0 15.348c0 3.981 5.099 6.395 10.086 6.395 6.536 0 10.888-3.801 10.888-6.82 0-1.822-1.547-2.854-2.915-3.284v.01zm1.908-5.092c-.766-.856-1.908-1.187-2.96-.962-.436.09-.706.511-.616.932.09.42.511.691.932.602.511-.105 1.067.044 1.442.465.376.421.466.977.316 1.473-.136.406.089.856.51.992.405.119.857-.105.992-.512.33-1.021.12-2.178-.646-3.035l.03.045zm2.418-2.195c-1.576-1.757-3.905-2.419-6.054-1.968-.496.104-.812.587-.706 1.081.104.496.586.813 1.082.707 1.532-.331 3.185.15 4.296 1.383 1.112 1.246 1.429 2.943.947 4.416-.165.48.106 1.007.586 1.157.479.165.991-.104 1.157-.586.675-2.088.241-4.478-1.338-6.235l.03.045z',
  ),
);
export const IconDouyin = icon(
  brand(
    'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  ),
);
