import { useState } from "react";
import {
  ClassworkStatus,
  learningActivityStatusColor,
} from "../../course/types/course-type";
import type { CalendarClassworkEvent } from "../types/calendar-type";
import LearningActivityDetailPopup from "./learning-activity-detail-popup";

type Props = {
  classworkDetail: CalendarClassworkEvent;
};

const LearningActivityEvent = (props: Props) => {
  const [openPopup, setIsOpenModal] = useState<boolean>(false);

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
                learningActivityStatusColor[props.classworkDetail.status]
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
            props.classworkDetail.status === ClassworkStatus.SUBMITTED &&
            "line-through"
          }`}
        >
          {props.classworkDetail.name}
        </div>
      </div>

      {openPopup && (
        <LearningActivityDetailPopup
          openPopup={openPopup}
          setIsOpenPopup={setIsOpenModal}
          classworkDetail={props.classworkDetail}
        />
      )}
    </div>
  );
};

export default LearningActivityEvent;
