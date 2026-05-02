import type { Weekday } from "../../../../constants/date";

export type CreateCourseSectionScheduleReq = {
  section_id: number;
  day_of_week: Weekday;
  start_time: string;
  end_time: string;
  classroom: string;
};
