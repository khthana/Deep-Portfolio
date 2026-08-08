import { type Dispatch, type SetStateAction } from "react";
import { weekdayLabel } from "../../../../constants/date";
import DetailPopup from "./detail-popup";
import type { CalendarCourseEvent } from "../types/calendar-type";

type Props = {
  openPopup: boolean;
  setIsOpenPopup: Dispatch<SetStateAction<boolean>>;
  courseDetail: CalendarCourseEvent;
};

const CourseDetailPopup = (props: Props) => {
  return (
    <DetailPopup
      openPopup={props.openPopup}
      setIsOpenPopup={props.setIsOpenPopup}
    >
      <div className="flex flex-col gap-6">
        <div className="border-l-[5px] border-primary-orange pl-4">
          {props.courseDetail.name}
        </div>

        <div className="grid grid-cols-3">
          <div className="flex flex-col gap-2 col-span-2">
            <div className="caption-bold text-primary-orange">
              วันและเวลาเรียน
            </div>

            <div className="flex gap-4 caption-regular">
              <div>{weekdayLabel[props.courseDetail.day_of_week]}</div>
              <div>{`${props.courseDetail.start_time} - ${props.courseDetail.end_time}`}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="caption-bold text-primary-orange">ห้องเรียน</div>
            <div className="caption-regular">
              {props.courseDetail.classroom}
            </div>
          </div>
        </div>
      </div>
    </DetailPopup>
  );
};
export default CourseDetailPopup;
