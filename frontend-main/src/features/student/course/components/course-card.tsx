import { useDispatch } from "react-redux";
import { homeSliceAction } from "../../home/stores/home-slice";
import { generatePath, useNavigate } from "react-router-dom";
import type { AppDispatch } from "../../../../stores/stores";
import { paths } from "../../../../routes/paths.config";
import type { CourseDetail } from "../../../../types/course-type.type";
import { weekdayLabel } from "../../../../constants/date";

type Props = {
  course: CourseDetail;
};

const CourseCard = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const path = generatePath(paths.student.course.detail, {
    secId: props.course.section_id,
  });

  const handleOnClick = () => {
    dispatch(homeSliceAction.setIsShowSubMenu(true));
    navigate(path);
  };

  return (
    <div
      className="bg-white 2xl:p-6 p-4 rounded-2xl flex 2xl:gap-12 gap-6 cursor-pointer hover:shadow-lg shadow-primary-grey/20 transition ease-in-out duration-300"
      onClick={handleOnClick}
    >
      <div className="bg-primary-orange 2xl:w-48 w-40 px-2 2xl:py-6 py-3 rounded-xl flex flex-col 2xl:gap-4 gap-2 items-center justify-center text-white">
        {props.course.day_of_week ? (
          <div className="body-bold-2">
            {weekdayLabel[props.course.day_of_week]}
          </div>
        ) : (
          "ยังไม่กำหนดวันเรียน"
        )}
        <div className="body-medium-3">
          {props.course?.start_time && props.course?.end_time && (
            <>
              {props.course?.start_time} - {props.course?.end_time}
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col 2xl:gap-4 gap-2 caption-regular">
        <div className="text-primary-orange">
          {props.course.classroom
            ? `ห้องเรียน ${props.course.classroom}`
            : "ยังไม่กำหนดห้องเรียน"}
        </div>
        <div className="body-bold-2">{props.course.course_name_en}</div>

        <div className="flex items-center gap-2 text-primary-grey">
          <div>{props.course.course_id}</div>
          <img src="/assets/course/point-icon.svg" alt="point icon" />
          <div>กลุ่ม {props.course.section_number}</div>
        </div>

        <div>{props.course.teacher_name_th}</div>
      </div>
    </div>
  );
};

export default CourseCard;
