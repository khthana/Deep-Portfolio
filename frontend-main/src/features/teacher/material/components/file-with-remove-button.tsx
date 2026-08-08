import { DeleteOutlined } from "@ant-design/icons";
import type { FileDetail } from "../../../../types/attachment-type.type";
import type { AppDispatch } from "../../../../stores/stores";
import { useDispatch } from "react-redux";
import { removeCourseMaterial } from "../stores/teacher-material-action";
import { message, Popconfirm, type FormInstance } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import type { AttachmentItemsType } from "./material-table";

type Props = {
  fileDetail: FileDetail;
  handleFetchData: () => void;
  messageInstance: MessageInstance;
  form: FormInstance<{ attachments: AttachmentItemsType[] }>;
};

const FileWithRemoveButton = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const handleOnRemove = async () => {
    try {
      const resp = await dispatch(
        removeCourseMaterial(props.fileDetail.attachment_id),
      ).unwrap();

      if (resp.success) {
        props.messageInstance.success("ลบไฟล์สำเร็จ");
        const currentAttachments =
          props.form.getFieldValue("attachments") || [];

        const newAttachments = currentAttachments.filter(
          (item: any) =>
            item.attachmentItems.attachment_id !==
            props.fileDetail.attachment_id,
        );
        props.form.setFieldsValue({ attachments: newAttachments });
        props.handleFetchData();
      }
    } catch (error) {
      props.messageInstance.error("ลบไฟล์ไม่สำเร็จ");
    }
  };

  return (
    <div className="w-full flex justify-between truncate">
      <div className="!underline text-start truncate">
        {props.fileDetail.title}
      </div>

      <Popconfirm
        title="คุณต้องการลบไฟล์นี้หรือไม่?"
        onConfirm={handleOnRemove}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
      >
        <DeleteOutlined
          width={16}
          className="cursor-pointer hover:!text-primary-red"
        />
      </Popconfirm>
    </div>
  );
};

export default FileWithRemoveButton;
