import { i18n, type MessageDescriptor } from '@lingui/core';

export type Lazy<T> = {
  readonly [K in keyof T]: T[K] extends MessageDescriptor ? string : T[K] extends object ? Lazy<T[K]> : T[K];
};

const isDescriptor = (value: unknown): value is MessageDescriptor =>
  typeof value === 'object' && value !== null && 'id' in value;

const property = (value: unknown): PropertyDescriptor => {
  if (isDescriptor(value)) return { get: () => i18n._(value), enumerable: true };
  return { value: typeof value === 'object' && value !== null ? lazyRecord(value) : value, enumerable: true };
};

export const lazyRecord = <T extends object>(source: T): Lazy<T> =>
  Object.defineProperties(
    {},
    Object.fromEntries(Object.entries(source).map(([key, value]) => [key, property(value)])),
  ) as Lazy<T>;

export const translate = (descriptor: MessageDescriptor, values?: Record<string, unknown>) =>
  i18n._(values ? { ...descriptor, values } : descriptor);
