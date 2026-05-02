export const cleanNullStr = (val: any): any => {
  if (val === "null" || val === "undefined") return "";
  if (Array.isArray(val)) return val.map(cleanNullStr);
  if (val !== null && typeof val === "object") {
    return Object.fromEntries(
      Object.entries(val).map(([k, v]) => [k, cleanNullStr(v)]),
    );
  }
  return val;
};
