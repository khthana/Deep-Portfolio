export const daysOfWeek = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

export const daysOfWeekShortNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export const monthNames = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

export const monthShortNames = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export const weekdayLabel: Record<Weekday, string> = {
  MON: "จันทร์",
  TUE: "อังคาร",
  WED: "พุธ",
  THU: "พฤหัสบดี",
  FRI: "ศุกร์",
  SAT: "เสาร์",
  SUN: "อาทิตย์",
};

export const dayArray = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const weekdayOptions = [
  { value: "MON", label: "จันทร์" },
  { value: "TUE", label: "อังคาร" },
  { value: "WED", label: "พุธ" },
  { value: "THU", label: "พฤหัสบดี" },
  { value: "FRI", label: "ศุกร์" },
  { value: "SAT", label: "เสาร์" },
  { value: "SUN", label: "อาทิตย์" },
];
