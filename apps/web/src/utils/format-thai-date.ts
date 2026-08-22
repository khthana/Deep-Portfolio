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

/**
 * Every date this renders arrived over JSON, which makes it a string — and
 * `new Date()` has been reading it as one all along, whatever the type said.
 * Twenty of the 22 call sites hand that string straight over; the two calendar
 * popups wrap it in `new Date()` first, which is why the union keeps `Date`
 * rather than narrowing to `string | null`. Narrowing also has to wait for the
 * features whose types still claim `Date`, so the union goes when the last of
 * them moves to `@deep-portfolio/api-types` (#68).
 */
export const convertDateToThaiFormat = (dateString: Date | string | null) => {
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

/** Widened to take a string for the same reason
 *  `checkIsOverSubmittionDeadline` below already does: the classwork lists
 *  hand it `ClassworkDetail.date`, which is an ISO string on the wire (#68),
 *  and the body builds its own Date from whatever it is given. */
export const checkIsToday = (date: Date | string | null) => {
  if (!date) return false;
  const today = new Date();

  return isSameDay(new Date(date), today);
};

/** Same widening, same caller — see `checkIsToday`. */
export const checkIsTomorrow = (date: Date | string | null) => {
  if (!date) return false;

  const today = new Date();
  const tomorrow = new Date(today);

  tomorrow.setDate(today.getDate() + 1);

  return isSameDay(new Date(date), tomorrow);
};

/** Its one live caller now hands it a string, both halves of the classroom
 *  screen having moved to @deep-portfolio/api-types (#68). The union stays
 *  anyway, for the same reason `convertDateToThaiFormat` keeps its: these two
 *  are general date helpers read side by side, the body builds its own Date
 *  from whatever it is given, and narrowing one of a pair that behaves
 *  identically only makes the pair harder to read. */
export const checkIsOverSubmittionDeadline = (
  deadline: Date | string | null,
) => {
  if (!deadline) return false;

  const now = new Date();
  const deadlineDate = new Date(deadline);

  return now.getTime() > deadlineDate.getTime();
};
