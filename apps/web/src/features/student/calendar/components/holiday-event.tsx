import type { HolidayDetail } from "../types/calendar-type";

type Props = {
  holidayDetail: HolidayDetail;
};

const HolidayEvent = (props: Props) => {
  return (
    <div className="bg-primary-black text-white rounded-[5px] text-xs font-normal px-2">
      {props.holidayDetail.name}
    </div>
  );
};

export default HolidayEvent;
