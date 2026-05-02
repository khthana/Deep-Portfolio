import { assignmentDueColor, type AssignmentDueType } from "../types/home-type";
import Button from "../../../../components/button/button";
import {
  ClassworkStatus,
  type ClassworkDetail,
} from "../../course/types/course-type";
import {
  checkIsOverSubmittionDeadline,
  convertDateToThaiFormat,
} from "../../../../utils/format-thai-date";
import { generateHTML } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useMemo } from "react";
import { generatePath, useNavigate } from "react-router-dom";
import { paths } from "../../../../routes/paths.config";

type Props = {
  assignmentDueType: AssignmentDueType;
  classworkDetail: ClassworkDetail;
};

const AssignmentCard = (props: Props) => {
  const navigate = useNavigate();

  const path = generatePath(paths.student.course.classwork.detail, {
    secId: props.classworkDetail.section_id,
    category: props.classworkDetail.category,
    activityId: props.classworkDetail.id,
  });

  const handleOnClick = () => {
    navigate(path);
  };

  const htmlContent = useMemo(() => {
    const content = props.classworkDetail.detail;

    if (!content) return "";

    try {
      return generateHTML(content, [StarterKit]);
    } catch (error) {
      console.error("Error generating HTML from Tiptap JSON:", error);
      return typeof content === "string" ? content : "";
    }
  }, [props.classworkDetail.detail]);

  return (
    <div
      className="2xl:w-110 2xl:p-8 p-4 w-68  bg-white rounded-2xl border-l-[10px] text-primary-grey flex flex-col 2xl:gap-4 gap-2 cursor-pointer hover:shadow-lg shadow-primary-grey/20 transition ease-in-out duration-300"
      style={{
        borderLeftColor: assignmentDueColor[props.assignmentDueType],
      }}
    >
      <div
        className="caption-bold"
        style={{
          color:
            assignmentDueColor[props.assignmentDueType] === "#FFFFFF"
              ? "#2C3142"
              : assignmentDueColor[props.assignmentDueType],
        }}
      >
        {convertDateToThaiFormat(props.classworkDetail.date)}
      </div>
      <div className="body-bold-3 text-primary-black">
        {props.classworkDetail.name}
      </div>

      <div className="flex flex-col gap-2">
        <div className="caption-regular truncate">
          {props.classworkDetail.subject_id} - {props.classworkDetail.course}
        </div>

        <div
          className="caption-regular line-clamp-1"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      <div className="flex justify-end">
        <Button
          className="!rounded-[20px]"
          onClick={handleOnClick}
          disable={
            props.classworkDetail.status === ClassworkStatus.GRADED
            // (checkIsOverSubmittionDeadline(
            //   props.classworkDetail.deadline_date,
            // ) &&
            //   !(props.classworkDetail.status === ClassworkStatus.NOT_SUBMITTED))
          }
        >
          {props.classworkDetail.status === ClassworkStatus.NOT_SUBMITTED ||
          props.classworkDetail.status === ClassworkStatus.LATE
            ? "ส่งงาน"
            : "ส่งอีกครั้ง"}
        </Button>
      </div>
    </div>
  );
};

export default AssignmentCard;
