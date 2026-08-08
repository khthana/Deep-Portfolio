import { useState } from "react";
import {
  ClassworkStatus,
  classworkStatusColor,
} from "../../course/types/course-type";
import ActivityDetailPopup from "./activity-detail-popup";
import type { CalendarClassworkEvent } from "../types/calendar-type";

type Props = {
  classworkDetail: CalendarClassworkEvent;
};

const ActivityEvent = (props: Props) => {
  const [openPopup, setIsOpenModal] = useState<boolean>(false);

  const isSubmittedOrGraded =
    props.classworkDetail.status === ClassworkStatus.SUBMITTED ||
    props.classworkDetail.status === ClassworkStatus.GRADED;

  return (
    <div className="relative w-full">
      <div
        className="flex gap-1 items-center cursor-pointer"
        onClick={() => setIsOpenModal(true)}
      >
        <div>
          <div
            className="h-2 w-2 rounded-full"
            style={{
              border: `2px solid ${
                classworkStatusColor[props.classworkDetail.status]
              }`,
              backgroundColor:
                props.classworkDetail.status === ClassworkStatus.SUBMITTED
                  ? "#7C7C7C"
                  : "white",
            }}
          />
        </div>
        <div
          className={`text-xs font-normal truncate ${
            isSubmittedOrGraded && "line-through"
          }`}
        >
          {props.classworkDetail.name}
        </div>
      </div>

      {openPopup && (
        <ActivityDetailPopup
          openPopup={openPopup}
          setIsOpenPopup={setIsOpenModal}
          classworkDetail={props.classworkDetail}
        />
      )}
    </div>
  );
};

export default ActivityEvent;
