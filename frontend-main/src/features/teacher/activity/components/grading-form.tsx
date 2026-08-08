import { Form, Tooltip, type FormInstance } from "antd";
import type {
  GradeStudentActivityData,
  GradingFormType,
} from "../types/activity-type.type";
import type { GetStudentActivityDetailResp } from "../../../../types/student-activity-type.type";
import TextArea from "antd/es/input/TextArea";
import RubricCard from "./rubric-card";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useForm } from "antd/es/form/Form";
import type { MessageInstance } from "antd/es/message/interface";
import { postGradeStudentActivity } from "../stores/teacher-activity-action";
import Button from "../../../../components/button/button";
import { InfoCircleOutlined } from "@ant-design/icons";

type Props = {
  gradingForm: FormInstance<GradingFormType>;
  classworkData: GetStudentActivityDetailResp;
  handleOnFinish: (value: GradingFormType) => void;
  messageApi: MessageInstance;

  action?: boolean;
  color?: "blue" | "orange";
};

const GradingForm = (props: Props) => {
  const activitySlice = useSelector(
    (state: RootState) => state.teacherActivity,
  );

  return (
    <Form
      form={props.gradingForm}
      onFinish={props.handleOnFinish}
      disabled={!props.action}
    >
      <div className="flex flex-col gap-4 h-100 overflow-y-auto mb-4">
        {props.classworkData.rubric_activity_mapping.map((rubric) => (
          <RubricCard
            rubric={rubric}
            gradingForm={props.gradingForm}
            action={props.action}
            color={props.color}
          />
        ))}
      </div>

      <Form.Item shouldUpdate noStyle>
        {() => {
          const errors = props.gradingForm.getFieldError("rubric_detail");

          if (errors.length === 0) return null;

          return (
            <div className="text-red-500 text-sm mb-2 text-right">
              <Form.ErrorList errors={errors} />
            </div>
          );
        }}
      </Form.Item>

      <Form.Item
        name="rubric_detail"
        noStyle
        rules={[
          {
            validator: (_, value) => {
              if (!value || value.length === 0) {
                return Promise.reject(
                  new Error("กรุณาเลือกระดับคะแนนของ rubric ให้ครบ"),
                );
              }

              const uniqueRubricIds = new Set(
                value.map((r: any) => r.rubric_id),
              );

              if (
                uniqueRubricIds.size !==
                props.classworkData.rubric_activity_mapping.length
              ) {
                return Promise.reject(
                  new Error("กรุณาเลือกระดับคะแนนของ rubric ให้ครบทุกข้อ"),
                );
              }

              return Promise.resolve();
            },
          },
        ]}
      >
        <></>
      </Form.Item>

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
            <Button loading={activitySlice.postGradeStudentActivityLoading}>
              บันทึก
            </Button>
          </div>
        </>
      )}
    </Form>
  );
};

export default GradingForm;
