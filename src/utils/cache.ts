export const weakCached = <K extends object, V>(build: (key: K) => V) => {
  const cache = new WeakMap<K, V>();
  return (key: K): V => {
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const value = build(key);
    cache.set(key, value);
    return value;
  };
};
