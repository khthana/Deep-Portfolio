import type { Dispatch, SetStateAction } from "react";
import {
  ClassworkStatus,
  classworkStatusColor,
  classworkStatusIcon,
  classworkStatusLabel,
} from "../../course/types/course-type";
import DetailPopup from "./detail-popup";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";
import type { CalendarClassworkEvent } from "../types/calendar-type";

type Props = {
  openPopup: boolean;
  setIsOpenPopup: Dispatch<SetStateAction<boolean>>;
  classworkDetail: CalendarClassworkEvent;
};

const ActivityDetailPopup = (props: Props) => {
  const isSubmittedOrGraded =
    props.classworkDetail.status === ClassworkStatus.SUBMITTED ||
    props.classworkDetail.status === ClassworkStatus.GRADED;

  return (
    <DetailPopup
      openPopup={props.openPopup}
      setIsOpenPopup={props.setIsOpenPopup}
    >
      <div className="flex flex-col gap-6">
        <div
          className="border-l-[5px] pl-4"
          style={{
            borderColor: classworkStatusColor[props.classworkDetail.status],
          }}
        >
          <div className={`${isSubmittedOrGraded && "line-through"}`}>
            {props.classworkDetail.name}
          </div>
          <div className="font-normal text-xs text-primary-grey">
            {props.classworkDetail.course}
          </div>
        </div>

        <div className="grid grid-cols-5">
          <div className="col-span-2 flex flex-col gap-2">
            <div className="caption-bold ">สถานะ</div>

            <div className="flex gap-1">
              <div
                className="caption-regular"
                style={{
                  color: classworkStatusColor[props.classworkDetail.status],
                }}
              >
                {classworkStatusLabel[props.classworkDetail.status]}
              </div>
              <img
                src={`${classworkStatusIcon[props.classworkDetail.status]}`}
                alt="status icon"
                width={16}
                height={16}
              />
            </div>
          </div>

          {props.classworkDetail.deadline_date && (
            <div className="col-span-3 flex flex-col gap-2">
              <div className="caption-bold ">กำหนดส่ง</div>
              <div className="caption-regular">
                {convertDateToThaiFormat(
                  new Date(props.classworkDetail.deadline_date),
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DetailPopup>
  );
};

export default ActivityDetailPopup;
