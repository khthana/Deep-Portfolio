export const formatDateToTimeString = (
  date: Date | null | undefined,
): string | null => {
  if (!date) return null;

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};
