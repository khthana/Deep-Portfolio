import { Form, InputNumber, Select, Tooltip, type FormProps } from "antd";
import type { Options } from "../../../../types/global-type";
import Button from "../../../../components/button/button";
import type { Dispatch, SetStateAction } from "react";
import type { ActivityFormType } from "../types/mapping-type.type";
import { ExclamationCircleOutlined } from "@ant-design/icons";

type Props = {
  options?: Options[];
  setIsAdding: Dispatch<SetStateAction<boolean>>;
  onAddActivity: (values: ActivityFormType) => void;
};

const AddActivityForm = (props: Props) => {
  const [activityForm] = Form.useForm<ActivityFormType>();

  const onFinish: FormProps<any>["onFinish"] = async (values) => {
    try {
      props.onAddActivity(values);

      props.setIsAdding(false);
    } catch (error) {}
  };

  return (
    <Form layout="vertical" onFinish={onFinish} form={activityForm}>
      <div className="grid 2xl:grid-cols-3 2xl:gap-2">
        <Form.Item
          name="activity"
          className="2xl:col-span-2"
          label="หัวช้อ"
          rules={[
            {
              required: true,
              message: "กรุณาเลือกกิจกรรมการประเมิน",
            },
          ]}
        >
          <Select className="w-full" options={props.options} />
        </Form.Item>

        <Form.Item
          className="w-full"
          label={
            <div className="flex gap-1">
              <div>น้ำหนัก</div>
              <Tooltip title="เปอร์เซ็นต์ผลการเรียนรู้">
                <ExclamationCircleOutlined />
              </Tooltip>
            </div>
          }
          name="weight"
          rules={[
            {
              required: true,
              message: "กรุณาใส่น้ำหนัก",
            },
          ]}
        >
          <InputNumber className="!w-full" min={0} max={100} />
        </Form.Item>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          variant="secondary"
          onClick={() => props.setIsAdding(false)}
          className="px-4 py-2 rounded-4xl"
        >
          ยกเลิก
        </Button>

        <Button
          className="px-4 py-2 rounded-4xl"
          //   onClick={() => props.setIsAdding(false)}
        >
          เพิ่มงาน
        </Button>
      </div>
    </Form>
  );
};

export default AddActivityForm;
