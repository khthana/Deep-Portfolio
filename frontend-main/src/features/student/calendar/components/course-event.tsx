import { useState } from "react";
import CourseDetailPopup from "./course-detail-popup";
import type { CalendarCourseEvent } from "../types/calendar-type";

type Props = {
  courseDetail: CalendarCourseEvent;
};

const CourseEvent = (props: Props) => {
  const [openPopup, setIsOpenPopup] = useState<boolean>(false);

  return (
    <div className="relative w-full">
      <div
        className="flex gap-1 items-center cursor-pointer"
        onClick={() => setIsOpenPopup(true)}
      >
        <div>
          <div className="h-2 w-2 rounded-full bg-primary-orange" />
        </div>
        <div className="text-xs font-normal truncate">{`${props.courseDetail.start_time} ${props.courseDetail.name}`}</div>
      </div>

      {openPopup && (
        <CourseDetailPopup
          courseDetail={props.courseDetail}
          openPopup={openPopup}
          setIsOpenPopup={setIsOpenPopup}
        />
      )}
    </div>
  );
};

export default CourseEvent;
