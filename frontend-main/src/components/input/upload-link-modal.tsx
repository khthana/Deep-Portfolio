import { Form, Input, Modal } from "antd";
import type { Dispatch, SetStateAction } from "react";
import type { AttachmentDetailItem } from "../../features/teacher/announcement/types/announement-type";
import Button from "../button/button";
import { useForm } from "antd/es/form/Form";

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  setPreviewAllFiles: Dispatch<SetStateAction<AttachmentDetailItem[]>>;
};

const UploadLinkModal = (props: Props) => {
  const [uploadLinkForm] = useForm<{ title: string; url: string }>();

  const handleOnUploadLink = () => {
    const title = uploadLinkForm.getFieldValue("title");
    const url = uploadLinkForm.getFieldValue("url");

    props.setPreviewAllFiles((prev: AttachmentDetailItem[]) => {
      const linkItem = {
        title: title,
        url: url,
      };

      return [
        ...prev,
        {
          attachmentType: "LINK",
          attachmentItems: linkItem,
        },
      ];
    });

    props.setOpen(false);
  };

  const handleOnCancel = () => {
    uploadLinkForm.resetFields();
    props.setOpen(false);
  };

  return (
    <Modal
      open={props.open}
      onCancel={() => props.setOpen(false)}
      title=""
      centered
      footer={null}
    >
      <Form layout="vertical" requiredMark={false} form={uploadLinkForm}>
        <Form.Item
          label="ชื่อลิงก์"
          name="title"
          rules={[{ required: true, message: "กรุณากรอกชื่อไฟล์" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="url"
          name="url"
          rules={[{ required: true, message: "กรุณากรอกลิงก์" }]}
        >
          <Input />
        </Form.Item>

        <div className="flex justify-between">
          <Button
            variant="secondary"
            className="caption-bold !px-4 !py-1"
            onClick={handleOnCancel}
          >
            ยกเลิก
          </Button>
          <Button
            className="caption-bold !px-4 !py-1"
            onClick={handleOnUploadLink}
          >
            เพิ่มลิงก์
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default UploadLinkModal;
