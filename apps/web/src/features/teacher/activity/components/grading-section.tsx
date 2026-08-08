import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import StatusChip from "./status-chip";
import RubricCard from "./rubric-card";
import TextArea from "antd/es/input/TextArea";
import ActivityFileCard from "./activity-file-card";
import { useEffect, useState } from "react";
import type {
  GradeStudentActivityData,
  GradingFormType,
} from "../types/activity-type.type";
import type { GetStudentActivityDetailResp } from "../../../../types/student-activity-type.type";
import type { FileDetail } from "../../../../types/attachment-type.type";
import Button from "../../../../components/button/button";
import { useForm } from "antd/es/form/Form";
import { Form, message } from "antd";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useDispatch, useSelector } from "react-redux";
import { postGradeStudentActivity } from "../stores/teacher-activity-action";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";
import RubricModal from "./rubric-modal";
import GradingForm from "./grading-form";
import { AttachmentType } from "../../announcement/types/announement-type";

type Props = {
  handlePreviewFile: (src: string) => void;
  classworkData: GetStudentActivityDetailResp;
  handleFetchStudentActivityDetail: () => void;

  action?: boolean;
  color?: "blue" | "orange";
};

const GradingSection = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [messageApi, contextHolder] = message.useMessage();

  const [gradingForm] = useForm<GradingFormType>();
  const [isSelected, setIsSelected] = useState<number>(0);
  const [openRubricModal, setOpenRubricModal] = useState<boolean>(false);

  const handleClassworkFileCardOnClick = (
    attachment_id: number,
    path: string,
    type: AttachmentType,
  ) => {
    setIsSelected(attachment_id);
    props.handlePreviewFile(path);
  };

  const handleOnFinish = async (value: GradingFormType) => {
    try {
      const totalLevel =
        props.classworkData.rubric_activity_mapping[0].rubric_levels.length;

      const data: GradeStudentActivityData = {
        activity_id: props.classworkData.activity_id,
        student_id: props.classworkData.student_id,
        activity_type: props.classworkData.activity_type,
        student_activity_id: props.classworkData.id,
        rubric_detail: value.rubric_detail,
        feedback: value.feedback,
        remark: value.remark,
        full_score: props.classworkData.score_number ?? 0,
        total_level: totalLevel,
      };

      const resp = await dispatch(postGradeStudentActivity(data)).unwrap();

      if (resp.success) {
        messageApi.success("บันทึกสำเร็จ");
        props.handleFetchStudentActivityDetail();
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  useEffect(() => {
    if (
      props.classworkData.submitted_files?.file &&
      props.classworkData.submitted_files?.file.length > 0
    ) {
      handleClassworkFileCardOnClick(
        props.classworkData.submitted_files?.file[0].attachment_id,
        props.classworkData.submitted_files?.file[0].file_path,
        AttachmentType.FILE,
      );
    } else if (
      props.classworkData.submitted_files?.url &&
      props.classworkData.submitted_files?.url.length > 0
    ) {
      handleClassworkFileCardOnClick(
        props.classworkData.submitted_files?.file[0].attachment_id,
        props.classworkData.submitted_files?.file[0].file_path,
        AttachmentType.LINK,
      );
    }
  }, [props.classworkData]);

  const handleInitData = () => {
    const rubricDetail = props.classworkData.student_activity_rubric_score
      .map((score) => {
        const mapping = props.classworkData.rubric_activity_mapping.find(
          (ram) =>
            ram.rubric_levels.some(
              (level) => level.id === score.rubric_level_id,
            ),
        );

        if (!mapping) return null;

        const rubricLevel = mapping.rubric_levels.find(
          (level) => level.id === score.rubric_level_id,
        );

        if (!rubricLevel) return null;

        return {
          rubric_id: score.rubric_activity_mapping_id,
          rubric_level_id: score.rubric_level_id,
          rubric_level_no: rubricLevel.level_no,
        };
      })
      .filter(
        (
          item,
        ): item is {
          rubric_id: number;
          rubric_level_id: number;
          rubric_level_no: number;
        } => item !== null,
      );

    if (rubricDetail.length === 0) return;

    gradingForm.setFieldsValue({
      rubric_detail: rubricDetail,
      feedback: props.classworkData.feedback ?? "",
      remark: props.classworkData.remark ?? "",
    });
  };

  useEffect(() => {
    if (props.classworkData.status !== "GRADED") return;

    handleInitData();
  }, [props.classworkData, gradingForm]);

  return (
    <div className="flex flex-col gap-4">
      {contextHolder}

      {/* งานกลุ่มจะไม่มี header ที่เป็นชื่อคนส่ง แต่จะเปลี่ยนเป็น StatusChip แทน */}
      {props.classworkData.activity_type === "INDIVIDUAL" && (
        <div className="flex 2xl:flex-row flex-col justify-between 2xl:items-end pb-5 border-b border-light-grey">
          <div>
            <div className="caption-bold">
              {props.classworkData.student_id}{" "}
              {props.classworkData.student.first_name_th}{" "}
              {props.classworkData.student.last_name_th}
            </div>
          </div>
          <StatusChip
            status={
              props.classworkData.status === "GRADED" ? "GRADED" : "PENDING"
            }
          />
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <div className="body-bold-3">การส่งงาน</div>
          {props.classworkData.status === "GRADED" &&
          props.classworkData.graded_at ? (
            <div className="text-primary-grey caption-regular">
              ตรวจเมื่อ {convertDateToThaiFormat(props.classworkData.graded_at)}
            </div>
          ) : props.classworkData.activity_type === "GROUP" ? (
            <StatusChip
              status={
                props.classworkData.status === "GRADED" ? "GRADED" : "PENDING"
              }
            />
          ) : null}
        </div>
        {props.classworkData.submitted_files &&
          props.classworkData.submitted_files?.file.length > 0 &&
          props.classworkData.submitted_files?.file.map((fileData, index) => (
            <ActivityFileCard
              key={fileData.attachment_id}
              handleClassworkFileCardOnClick={handleClassworkFileCardOnClick}
              fileData={fileData}
              isSelected={isSelected}
              color={props.color}
            />
          ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between 2xl:items-center">
          <div className="flex 2xl:flex-row flex-col 2xl:items-center 2xl:gap-2">
            <div className="body-bold-3">เกณฑ์การประเมิน</div>
            <div
              className={`caption-bold ${props.color === "blue" ? "text-secondary-blue" : "text-primary-orange"}`}
            >
              {props.classworkData.status === "GRADED" &&
              props.classworkData.student_score
                ? `${props.classworkData.student_score}/${props.classworkData.score_number} คะแนน`
                : `คะแนนเต็ม ${props.classworkData.score_number} คะแนน`}
            </div>
          </div>

          <a
            className="text-primary-grey cursor-pointer caption-regular"
            onClick={() => setOpenRubricModal(true)}
          >
            ดูเกณฑ์แบบเต็ม
          </a>
        </div>
      </div>

      <RubricModal
        rubrics={props.classworkData.rubric_activity_mapping}
        expected_level={props.classworkData.expected_level ?? 0}
        openRubricModal={openRubricModal}
        setOpenRubricModal={setOpenRubricModal}
      />

      <GradingForm
        gradingForm={gradingForm}
        classworkData={props.classworkData}
        handleOnFinish={handleOnFinish}
        messageApi={messageApi}
        action={props.action}
        color={props.color}
      />
    </div>
  );
};

export default GradingSection;
