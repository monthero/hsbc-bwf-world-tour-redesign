export const HEADER_VAR = '--bwf-header-h';
export const TABBAR_VAR = '--bwf-tabbar-h';

export const cssPx = (el: Element, name: string) => Number.parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;

export const headerOffset = () => cssPx(document.documentElement, HEADER_VAR);
