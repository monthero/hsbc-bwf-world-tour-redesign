import { prefersReducedMotion } from './motion';

export const scrollBehavior = (instant?: boolean): ScrollBehavior =>
  instant || prefersReducedMotion() ? 'auto' : 'smooth';

export const centerChild = (el: HTMLElement, child: HTMLElement, behavior: ScrollBehavior = 'auto') =>
  el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2, behavior });

export const inlineSign = (el: Element) => (getComputedStyle(el).direction === 'rtl' ? -1 : 1);
