import { type UpcomingEvent } from "../types/calendar-type";
import {
  daysOfWeekShortNames,
  monthShortNames,
} from "../../../../constants/date";
import { ClassworkStatus } from "../../course/types/course-type";
import { formatDateToTimeString } from "../../../../utils/convert-time";
import { useEffect } from "react";

type Props = {
  upcomingEvent: UpcomingEvent;
};

const UpcomingEventsCard = (props: Props) => {
  const today = new Date();
  const currentDate = new Date(props.upcomingEvent.date);
  const currentMonth = currentDate.getMonth();

  const dayOfWeek = currentDate.getDay();
  const isToday =
    currentDate.getDate() === today.getDate() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  return (
    <div className="w-full 2xl:p-8 p-4 rounded-2xl bg-white grid grid-cols-10 gap-6">
      <div className=" text-primary-orange flex flex-col 2xl:gap-4 gap-2 items-center">
        <div>{isToday ? "วันนี้" : daysOfWeekShortNames[dayOfWeek]}</div>
        <div className="body-bold-3 flex gap-2">
          <div>{currentDate.getDate()}</div>
          <div>{monthShortNames[currentMonth]}</div>
        </div>
      </div>

      <div className="col-span-3 flex flex-col 2xl:gap-4 gap-2 caption-regular">
        <div className="caption-bold">วิชาเรียน</div>
        <div className="flex flex-col gap-2">
          {props.upcomingEvent.courses.length > 0 ? (
            props.upcomingEvent.courses.map((event, index) => (
              <div key={index} className="flex gap-2">
                <div className="text-primary-orange text-nowrap">{`${event.start_time} - ${event.end_time}`}</div>
                <div>{event.name}</div>
              </div>
            ))
          ) : (
            <div>ไม่มี</div>
          )}
        </div>
      </div>

      <div className="col-span-3 flex flex-col 2xl:gap-4 gap-2 caption-regular">
        <div className="caption-bold">กิจกรรมการประเมิน</div>
        <div className="flex flex-col gap-2">
          {props.upcomingEvent.activities.length > 0 ? (
            props.upcomingEvent.activities.map((event, index) => (
              <div
                key={index}
                className={`flex gap-2 ${
                  event.status === ClassworkStatus.SUBMITTED ||
                  event.status === ClassworkStatus.GRADED
                    ? "line-through"
                    : ""
                }`}
              >
                {event.deadline_date && (
                  <div
                    style={{
                      color:
                        event.status === ClassworkStatus.SUBMITTED ||
                        event.status === ClassworkStatus.GRADED
                          ? "#2C3142"
                          : "#3068D9",
                    }}
                  >
                    {formatDateToTimeString(new Date(event.deadline_date))}
                  </div>
                )}
                <div>{event.name}</div>
              </div>
            ))
          ) : (
            <div>ไม่มี</div>
          )}
        </div>
      </div>

      <div className="col-span-3 flex flex-col 2xl:gap-4 gap-2 caption-regular">
        <div className="caption-bold">กิจกรรมการเรียนรู้</div>
        <div className="flex flex-col gap-2">
          {props.upcomingEvent.learning_activities.length > 0 ? (
            props.upcomingEvent.learning_activities.map((event, index) => (
              <div
                key={index}
                className={`flex gap-2 ${
                  event.status === ClassworkStatus.SUBMITTED ||
                  event.status === ClassworkStatus.GRADED
                    ? "line-through"
                    : ""
                }`}
              >
                {event.deadline_date && (
                  <div
                    style={{
                      color:
                        event.status === ClassworkStatus.SUBMITTED ||
                        event.status === ClassworkStatus.GRADED
                          ? "#2C3142"
                          : "#3B8B5C",
                    }}
                  >
                    {formatDateToTimeString(new Date(event.deadline_date))}
                  </div>
                )}
                <div>{event.name}</div>
              </div>
            ))
          ) : (
            <div>ไม่มี</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpcomingEventsCard;
