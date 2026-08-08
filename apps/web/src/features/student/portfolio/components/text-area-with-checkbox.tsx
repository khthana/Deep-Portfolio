import { Form } from "antd";
import TextArea from "antd/es/input/TextArea";
import CheckboxWithLabel from "../../../../components/input/checkbox-with-label";

type Props = {
  label: string;
  isShow: boolean;
  setIsShow: React.Dispatch<React.SetStateAction<boolean>>;
  name?: string;
};

const TextAreaWithCheckbox = (props: Props) => {
  return (
    <>
      <div className="flex justify-between mb-4 caption-regular">
        <div>{props.label}</div>
        <CheckboxWithLabel
          label="แสดงบนหน้าแฟ้มผลงาน"
          checked={props.isShow}
          onChange={() => props.setIsShow(!props.isShow)}
        />
      </div>
      <Form.Item name={props.name}>
        <TextArea rows={4} />
      </Form.Item>
    </>
  );
};

export default TextAreaWithCheckbox;
