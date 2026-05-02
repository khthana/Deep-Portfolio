import { daysOfWeekShortNames, monthShortNames } from "../constants/date";

export const formatThaiDate = (dateStr: string): string => {
  const date = new Date(dateStr);

  const day = date.getDate();
  const month = monthShortNames[date.getMonth()];
  const year = date.getFullYear() + 543;

  return `${day} ${month} ${year}`;
};

export const getShortDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const dayOfWeek = daysOfWeekShortNames[d.getDay()];

  return `${dayOfWeek}`;
};

export const convertDateToThaiFormat = (dateString: Date | null) => {
  if (!dateString) return;

  const date = new Date(dateString);

  const thaiDate = date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    calendar: "buddhist",
  });

  const thaiTime = date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${thaiDate}, ${thaiTime}`;
};

export const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const checkIsToday = (date: Date | null) => {
  if (!date) return false;
  const today = new Date();

  return isSameDay(new Date(date), today);
};

export const checkIsTomorrow = (date: Date | null) => {
  if (!date) return false;

  const today = new Date();
  const tomorrow = new Date(today);

  tomorrow.setDate(today.getDate() + 1);

  return isSameDay(new Date(date), tomorrow);
};

export const checkIsOverSubmittionDeadline = (deadline: Date | null) => {
  if (!deadline) return false;

  const now = new Date();
  const deadlineDate = new Date(deadline);

  return now.getTime() > deadlineDate.getTime();
};
