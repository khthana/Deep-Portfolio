import { paths } from "../../../../routes/paths.config";
import { useNavigate, generatePath } from "react-router-dom";
import type { CourseDetailBrief } from "../types/home-type";
import { weekdayLabel } from "../../../../constants/date";

type Props = {
  course: CourseDetailBrief;
};

const CourseCard = (props: Props) => {
  const navigate = useNavigate();
  const path = generatePath(paths.teacher.course.detail, {
    secId: props.course.section_id,
  });

  const handleCardOnClick = () => {
    navigate(path);
  };

  return (
    <div
      onClick={handleCardOnClick}
      className="w-full !text-primary-black !bg-white rounded-2xl flex flex-col gap-6 pb-8 cursor-pointer hover:shadow-lg shadow-primary-grey/20 transition ease-in-out duration-300"
    >
      <div className="flex justify-between items-center text-white py-2 px-8 bg-secondary-blue rounded-t-2xl">
        <div className="body-bold-3">{props.course.course_id}</div>
        <div>กลุ่ม {props.course.section_number}</div>
      </div>
      <div className="flex flex-col gap-6 px-8">
        <div className="body-bold-3 pb-5 border-b border-light-grey truncate">
          {props.course.course_name_en}
        </div>

        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <div className="text-primary-grey">วันเวลาสอน</div>
            <div className="flex gap-2">
              <div>
                {props.course?.day_of_week
                  ? weekdayLabel[props.course?.day_of_week]
                  : "ยังไม่กำหนด"}
              </div>
              <div>
                {props.course?.start_time && props.course?.end_time && (
                  <>
                    {props.course?.start_time} - {props.course?.end_time}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="text-primary-grey">ภาคเรียนที่</div>
            <div>{`${props.course.semester}/${props.course.academic_year}`}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
