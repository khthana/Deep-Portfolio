import UploadButton from "../../../../components/input/upload-button";
import { AttachmentType } from "../../../teacher/announcement/types/announement-type";

type Props = {
  title?: string;
  onUploadFile: () => void;
  onUploadImage: () => void;
};

const UploadSection = (props: Props) => {
  return (
    <div className="flex flex-col gap-4">
      {props.title && <div>{props.title}</div>}
      <div className="flex gap-8">
        <UploadButton
          color="orange"
          label="เพิ่มรูปภาพ"
          iconSrc="/assets/portfolio/add-image-orange-icon.svg"
          accept=".png,.jpg,.jpeg"
          name="attachments"
          onUpload={props.onUploadFile}
          attachmentType={AttachmentType.IMAGE}
        />
        <UploadButton
          color="orange"
          label="เพิ่มไฟล์"
          iconSrc="/assets/portfolio/add-file-orange-icon.svg"
          accept=".pdf,.docx,.doc,.txt,.xls,.xlsx,.ods,.ppt,.pptx,.csv"
          name="attachments"
          onUpload={props.onUploadImage}
          attachmentType={AttachmentType.FILE}
        />
      </div>
    </div>
  );
};

export default UploadSection;
