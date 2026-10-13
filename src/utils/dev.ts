import { notFound } from '@tanstack/react-router';

export const devOnly = () => {
  if (!import.meta.env.DEV) throw notFound();
};
