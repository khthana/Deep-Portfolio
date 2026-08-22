import type { CalendarCourseEvent } from "@deep-portfolio/api-types";
import { type Dispatch, type SetStateAction } from "react";
import { weekdayLabel } from "../../../../constants/date";
import DetailPopup from "./detail-popup";

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
              {/* All four schedule fields are nullable, because a section with
                  no timetable row has none of them — which the old copy of this
                  shape denied (#68). A missing day draws nothing rather than
                  indexing on null. */}
              <div>
                {props.courseDetail.day_of_week
                  ? weekdayLabel[props.courseDetail.day_of_week]
                  : ""}
              </div>
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
