const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'];

export const formatBytes = (bytes: number) => {
  const exp = Math.min(BYTE_UNITS.length - 1, bytes > 0 ? Math.floor(Math.log(bytes) / Math.log(1024)) : 0);
  const value = bytes / 1024 ** exp;
  return `${exp && value < 10 ? value.toFixed(1) : Math.round(value)} ${BYTE_UNITS[exp]}`;
};
