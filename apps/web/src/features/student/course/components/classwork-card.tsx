import {
  classworkStatusColor,
  classworkStatusIcon,
  classworkStatusLabel,
  classworkTypeBGColor,
  classworkTypeLabel,
  classworkTypeTextColor,
  type ClassworkDetail,
} from "../types/course-type";
import { generatePath, useNavigate, useParams } from "react-router-dom";
import { paths } from "../../../../routes/paths.config";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";

type Props = {
  classworkDetail: ClassworkDetail;
};

const ClassworkCard = (props: Props) => {
  const navigate = useNavigate();
  const { secId } = useParams<{ secId: string }>();

  const path = generatePath(paths.student.course.classwork.detail, {
    secId,
    category: props.classworkDetail.category,
    activityId: props.classworkDetail.id,
  });

  const handleOnClick = () => {
    navigate(path);
  };

  return (
    <div
      onClick={handleOnClick}
      className="bg-white caption-regular w-full rounded-2xl 2xl:px-6 px-4 py-4 flex justify-between cursor-pointer hover:shadow-lg shadow-primary-grey/20 transition ease-in-out duration-300"
    >
      <div className="flex flex-col 2xl:gap-4 text-primary-black">
        <div className="body-bold-3 flex gap-3 items-center">
          <div>{props.classworkDetail.name}</div>
          <div
            className="rounded-2xl 2xl:p-2 p-1 caption-bold"
            style={{
              backgroundColor: classworkTypeBGColor[props.classworkDetail.type],
              color: classworkTypeTextColor[props.classworkDetail.type],
            }}
          >
            {classworkTypeLabel[props.classworkDetail.type]}
          </div>
        </div>

        <div>{convertDateToThaiFormat(props.classworkDetail.date)}</div>
      </div>

      <div
        className="flex flex-col items-end 2xl:gap-6 gap-2"
        style={{ color: classworkStatusColor[props.classworkDetail.status] }}
      >
        <div className="caption-bold">
          {props.classworkDetail.received_point && props.classworkDetail.point
            ? `${props.classworkDetail.received_point}/${props.classworkDetail.point} คะแนน`
            : props.classworkDetail.point
              ? `${props.classworkDetail.point} คะแนน`
              : "ไม่มีคะแนน"}
        </div>
        <div className="flex items-center gap-0.5">
          <div>{classworkStatusLabel[props.classworkDetail.status]}</div>
          <img
            src={classworkStatusIcon[props.classworkDetail.status]}
            alt={props.classworkDetail.name}
          />
        </div>
      </div>
    </div>
  );
};

export default ClassworkCard;
