import { Form, Upload, type UploadFile, type UploadProps } from "antd";
import type { RcFile, UploadChangeParam } from "antd/es/upload";
import Button from "../../../../components/button/button";
import { AttachmentType } from "../../../../types/attachment-type.type";

type Props = UploadProps & {
  name: string;
  attachmentType: AttachmentType;
  onUpload: (info: UploadChangeParam<UploadFile>, type: AttachmentType) => void;
  loading?: boolean;
};

const UploadClassworkButton = ({ ...props }: Props) => {
  return (
    <Upload
      {...props}
      accept=".pdf,.docx,.doc,.txt,.xls,.xlsx,.ods,.ppt,.pptx,.csv .png,.jpg,.jpeg"
      className="!w-full [&_.ant-upload-select]:!w-full [&_.ant-upload]:!w-full"
      onChange={(info) => props.onUpload(info, AttachmentType.FILE)}
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
        variant="secondary"
        iconSrc="/assets/course/add-icon.svg"
        type="button"
        loading={props.loading}
        className="!font-medium rounded-xl !w-full"
      >
        เพิ่มไฟล์งาน
      </Button>
    </Upload>
  );
};

export default UploadClassworkButton;
