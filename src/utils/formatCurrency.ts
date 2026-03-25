export const formatCurrency = (value: number, currency: string = 'INR', compact: boolean = false): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
};

export const formatCr = (value: number): string => {
  return `₹${(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
};
