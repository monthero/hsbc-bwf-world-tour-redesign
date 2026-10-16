import { useComputedColorScheme } from '@mantine/core';
import { useEffect } from 'react';

const META = 'meta[name="theme-color"]';

export const useThemeColorMeta = () => {
  const scheme = useComputedColorScheme('dark', { getInitialValueInEffect: false });
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.mantineColorScheme !== scheme) return;
    const color = getComputedStyle(root).getPropertyValue('--bwf-bg').trim();
    if (!color) return;
    for (const meta of document.querySelectorAll<HTMLMetaElement>(META)) meta.content = color;
  }, [scheme]);
};
