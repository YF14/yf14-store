export function formatIQD(value) {
  const num = Number(value || 0);
  return `${num.toLocaleString('en-US')} IQD`;
}

export function formatPrice(value) {
  return formatIQD(value);
}

export function catName(cat, isRTL) {
  if (!cat) return '';
  return isRTL && cat.nameAr ? cat.nameAr : cat.name;
}
