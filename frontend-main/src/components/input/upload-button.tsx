import Button from "../button/button";
import { Form, Upload, type UploadFile, type UploadProps } from "antd";
import type { RcFile, UploadChangeParam } from "antd/es/upload";
import type { AttachmentType } from "../../features/teacher/announcement/types/announement-type";

type Props = UploadProps & {
  label: string;
  iconSrc: string;
  name?: string;
  attachmentType: AttachmentType;
  onUpload: (info: UploadChangeParam<UploadFile>, type: AttachmentType) => void;
  color?: "blue" | "orange";
  loading?: boolean;
  noStyle?: boolean;
  size?: "small" | "large";
};

const UploadButton = ({
  color = "orange",
  size = "large",
  noStyle = false,
  ...props
}: Props) => {
  return (
    <Form.Item name={props.name} noStyle={noStyle}>
      <Upload
        {...props}
        onChange={(info) => props.onUpload(info, props.attachmentType)}
        customRequest={async ({ file, onSuccess, onError }) => {
          setTimeout(() => {
            onSuccess?.("ok");
          }, 0);
        }}
        itemRender={() => {
          return <div></div>;
        }}
      >
        <Button
          variant={color === "orange" ? "outline" : "secondary"}
          iconSrc={props.iconSrc}
          type="button"
          loading={props.loading}
          className={`rounded-4xl ${size === "small" ? "caption-bold !py-1 !px-4" : ""}`}
        >
          {props.label}
        </Button>
      </Upload>
    </Form.Item>
  );
};

export default UploadButton;
