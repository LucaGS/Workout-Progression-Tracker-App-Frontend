export const nowIsoString = () => new Date().toISOString();

export const formatDate = (value) => {
  if (!value) return '–';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (value) => {
  if (!value) return '–';
  const date = new Date(value);
  return `${formatDate(value)} ${date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};
