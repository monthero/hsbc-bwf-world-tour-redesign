export const HEADER_VAR = '--bwf-header-h';
export const TABBAR_VAR = '--bwf-tabbar-h';

const TABBAR_FALLBACK = 51;

export const cssPx = (el: Element, name: string) => Number.parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;

export const headerOffset = () => cssPx(document.documentElement, HEADER_VAR);

export const tabbarHeight = (el: Element) => cssPx(el, TABBAR_VAR) || TABBAR_FALLBACK;

export const keepTopInView = (el: Element) => {
  const top = el.getBoundingClientRect().top - headerOffset() - tabbarHeight(el);
  if (top < 0) window.scrollTo({ top: window.scrollY + top, behavior: 'instant' });
};
