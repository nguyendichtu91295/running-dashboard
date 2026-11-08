export const liveNumberFormat = (
  value: number,
  options?: Intl.NumberFormatOptions,
): string => new Intl.NumberFormat('en-US', options).format(value);
