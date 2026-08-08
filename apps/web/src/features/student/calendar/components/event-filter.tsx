import { useDispatch, useSelector } from "react-redux";
import CheckboxWithLabel from "../../../../components/input/checkbox-with-label";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { EventType } from "../types/calendar-type";
import { calendarSliceAction } from "../stores/calendar-slice";

const EventFilter = () => {
  return (
    <div className="flex gap-4">
      <CheckboxFilter
        label="วิชาเรียน"
        color="orange"
        eventType={EventType.COURSE}
      />
      <CheckboxFilter
        label="กิจกรรมการประเมิน"
        color="blue"
        eventType={EventType.ACTIVITY}
      />
      <CheckboxFilter
        label="กิจกรรมการเรียนรู้"
        color="green"
        eventType={EventType.LEARNING_ACTIVITY}
      />
    </div>
  );
};

//------------------------------------------------

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  eventType: EventType;
  color?: "green" | "orange" | "blue" | "black";
};

const CheckboxFilter = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const calendarSlice = useSelector((state: RootState) => state.calendar);

  const handleCheckboxOnClick = () => {
    const oldEventFilter = calendarSlice.eventFilter;
    let newEventFilter: EventType[] = [];

    if (oldEventFilter.includes(props.eventType)) {
      newEventFilter = oldEventFilter.filter(
        (event) => event !== props.eventType,
      );
    } else {
      newEventFilter = [...oldEventFilter, props.eventType];
    }

    dispatch(calendarSliceAction.setEventFilter(newEventFilter));
  };

  return (
    <CheckboxWithLabel
      label={props.label}
      color={props.color}
      checked={calendarSlice.eventFilter.includes(props.eventType)}
      onChange={handleCheckboxOnClick}
    />
  );
};

export default EventFilter;
