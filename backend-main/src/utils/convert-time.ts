export const convertTimeToDate = (time: string) =>
  new Date(`1970-01-01T${time}Z`);

export const formatDateToTimeString = (
  date: Date | null | undefined,
): string | null => {
  if (!date) return null;

  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};
