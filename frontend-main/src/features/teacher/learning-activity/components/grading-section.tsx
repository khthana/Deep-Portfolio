import { useEffect, useState } from "react";
import type { GetStudentLearningActivityDetailResp } from "../../../../types/student-learning-activity-type.type";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";
import ActivityFileCard from "../../activity/components/activity-file-card";
import StatusChip from "../../activity/components/status-chip";
import type { FileDetail } from "../../../../types/attachment-type.type";
import TextArea from "antd/es/input/TextArea";
import { useForm } from "antd/es/form/Form";
import type {
  GradeStudentLearningActivityData,
  GradingFormType,
} from "../types/learning-activity-type.type";
import { Form, Input, message, Tooltip } from "antd";
import Button from "../../../../components/button/button";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { postGradeStudentLearningActivity } from "../stores/teacher-learning-activity-action";
import { InfoCircleOutlined } from "@ant-design/icons";
import { AttachmentType } from "../../announcement/types/announement-type";

type Props = {
  handlePreviewFile: (src: string) => void;
  classworkData: GetStudentLearningActivityDetailResp;
  handleFetchStudentLearningActivityDetail: () => void;

  action?: boolean;
  color?: "blue" | "orange";
};

const GradingSection = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const learningActivitySlice = useSelector(
    (state: RootState) => state.teacherLearningActivity,
  );

  const [messageApi, contextHolder] = message.useMessage();

  const [isSelected, setIsSelected] = useState<number>(0);
  const [gradingForm] = useForm<GradingFormType>();

  const handleClassworkFileCardOnClick = (
    // fileData: FileDetail,
    attachment_id: number,
    path: string,
    type: AttachmentType,
  ) => {
    setIsSelected(attachment_id);

    if (type === AttachmentType.FILE) {
      props.handlePreviewFile(path);
    } else {
      window.open(path, "_blank");
      props.handlePreviewFile("-1");
    }
  };

  const handleOnFinish = async (value: GradingFormType) => {
    try {
      console.log(value);

      const data: GradeStudentLearningActivityData = {
        activity_type: props.classworkData.learning_activity_type,
        student_learning_activity_id: props.classworkData.id,
        feedback: value.feedback,
        remark: value.remark,
      };

      const resp = await dispatch(
        postGradeStudentLearningActivity(data),
      ).unwrap();

      if (resp.success) {
        messageApi.success("บันทึกสำเร็จ");
        props.handleFetchStudentLearningActivityDetail();
      }
    } catch (error) {}
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
      props.classworkData.submitted_files?.file.length === 0 &&
      props.classworkData.submitted_files?.url &&
      props.classworkData.submitted_files?.url.length > 0
    ) {
      handleClassworkFileCardOnClick(
        props.classworkData.submitted_files?.url[0].attachment_id,
        props.classworkData.submitted_files?.url[0].url,
        AttachmentType.LINK,
      );
    }
  }, [props.classworkData]);

  useEffect(() => {
    if (props.classworkData.status === "GRADED") {
      gradingForm.setFieldsValue({
        feedback: props.classworkData.feedback ?? "",
        remark: props.classworkData.remark ?? "",
      });
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {contextHolder}

      {/* งานกลุ่มจะไม่มี header ที่เป็นชื่อคนส่ง แต่จะเปลี่ยนเป็น StatusChip แทน */}
      {props.classworkData.learning_activity_type === "INDIVIDUAL" && (
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
            <div className="text-primary-grey">
              ตรวจเมื่อ {convertDateToThaiFormat(props.classworkData.graded_at)}
            </div>
          ) : props.classworkData.learning_activity_type === "GROUP" ? (
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

        {props.classworkData.submitted_files &&
          props.classworkData.submitted_files?.url.length > 0 &&
          props.classworkData.submitted_files?.url.map((urlData, index) => (
            <ActivityFileCard
              key={urlData.attachment_id}
              handleClassworkFileCardOnClick={handleClassworkFileCardOnClick}
              urlData={urlData}
              isSelected={isSelected}
              color={props.color}
            />
          ))}

        <Form
          form={gradingForm}
          layout="vertical"
          onFinish={handleOnFinish}
          disabled={!props.action}
        >
          <div className="flex gap-2 caption-bold mb-2">
            <div>ความคิดเห็นของอาจารย์</div>

            <Tooltip title="ความคิดเห็นของอาจารย์จะถูกแสดงใน EPortfolio ของนักศึกษา">
              <InfoCircleOutlined />
            </Tooltip>
          </div>
          <Form.Item name="feedback">
            <TextArea rows={4} />
          </Form.Item>

          {props.action && (
            <>
              <div className="flex gap-2 caption-bold mb-2">
                <div>หมายเหตุ</div>

                <Tooltip title="หมายเหตุสำหรับอาจารย์ นักศึกษาไม่สามารถเห็นข้อความนี้ได้">
                  <InfoCircleOutlined />
                </Tooltip>
              </div>
              <Form.Item name="remark">
                <TextArea rows={2} />
              </Form.Item>

              <div className="flex justify-end">
                <Button
                  loading={
                    learningActivitySlice.postGradeStudentLearningActivity
                  }
                >
                  บันทึก
                </Button>
              </div>
            </>
          )}
        </Form>
      </div>
    </div>
  );
};

export default GradingSection;
