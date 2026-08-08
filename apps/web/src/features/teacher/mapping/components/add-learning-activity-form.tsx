import { Form, InputNumber, Select, type FormProps } from "antd";
import type { Options } from "../../../../types/global-type";
import Button from "../../../../components/button/button";
import type { Dispatch, SetStateAction } from "react";
import type { LearningActivityFormType } from "../types/mapping-type.type";

type Props = {
  options?: Options[];
  setIsAdding: Dispatch<SetStateAction<boolean>>;
  onAddLearningActivity: (values: LearningActivityFormType) => void;
};

const AddLearningActivityForm = (props: Props) => {
  const [learningActivityForm] = Form.useForm<LearningActivityFormType>();

  const onFinish: FormProps<any>["onFinish"] = async (values) => {
    try {
      props.onAddLearningActivity(values);

      props.setIsAdding(false);
    } catch (error) {}
  };

  return (
    <Form layout="vertical" onFinish={onFinish} form={learningActivityForm}>
      <Form.Item
        name="learning_activity"
        className="col-span-2"
        label="หัวช้อ"
        rules={[
          {
            required: true,
            message: "กรุณาเลือกกิจกรรมการเรียนรู้",
          },
        ]}
      >
        <Select className="w-full" options={props.options} />
      </Form.Item>

      <div className="flex gap-2 justify-end">
        <Button
          variant="secondary"
          onClick={() => props.setIsAdding(false)}
          className="px-4 py-2 rounded-4xl"
        >
          ยกเลิก
        </Button>

        <Button className="px-4 py-2 rounded-4xl">เพิ่มงาน</Button>
      </div>
    </Form>
  );
};

export default AddLearningActivityForm;
