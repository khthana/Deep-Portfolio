export type UserDetail = {
  user_id: string;
  full_name_th: string;
  full_name_en: string;
  title_th: string;
  title_en: string;
  email: string;
  phone: string;
  role: string;
};

// StudentDetail used to be declared here. It moved to
// @deep-portfolio/api-types (#68) — import it from there. It went ahead of the
// rest of the user feature because the aggregate /portfolio/public/:token
// embeds it (ADR-0043 §3). Four of its ten fields were nullable here and none of
// them is: getStudentDetail coalesces every one of them to "" before answering.
