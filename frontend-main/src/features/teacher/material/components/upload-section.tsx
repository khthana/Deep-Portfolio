import { useEffect, useState } from "react";
import Button from "../../../../components/button/button";
import UploadButton from "../../../../components/input/upload-button";
import PreviewListFile from "../../announcement/components/preview-list-file";
import UploadLinkForm from "../../announcement/components/upload-link-form";
import {
  AttachmentType,
  type AttachmentDetailItem,
} from "../../announcement/types/announement-type";
import {
  Form,
  message,
  Upload,
  type FormInstance,
  type UploadFile,
} from "antd";
import type { UploadChangeParam } from "antd/es/upload";
import MaterialUploadLinkForm from "./material-upload-link-form";
import type { AttachmentItemsType } from "./material-table";
import type { MessageInstance } from "antd/es/message/interface";

type Props = {
  type: "LECTURE" | "RECORD";
  form: FormInstance<{ attachments: AttachmentItemsType[] }>;
  messageInstance: MessageInstance;
};

const UploadSection = (props: Props) => {
  const [showUploadLinkForm, setShowUploadLinkForm] = useState(false);
  // const [attachmentItems, setAttachmentItems] = useState<AttachmentItemsType[]>(
  //   [],
  // );

  const [previewAllFiles, setPreviewAllFiles] = useState<
    AttachmentDetailItem[]
  >([]);

  const handleOnUpload = (
    info: UploadChangeParam<UploadFile>,
    type: AttachmentType,
  ) => {
    const { file } = info;
    // ป้องกันการเรียกใช้ function 2 รอบ
    if (file.status !== "done" || type === AttachmentType.LINK) return;

    const currentValue = props.form.getFieldValue("attachments") || [];
    console.log("currentValue : ", currentValue);

    setPreviewAllFiles((prev: AttachmentDetailItem[]) => {
      return [
        ...prev,
        {
          attachmentType: type,
          attachmentItems: info.file,
        },
      ];
    });

    const newData = {
      type: props.type,
      attachmentType: type,
      attachmentItems: info.file,
    };
    console.log("newData : ", newData);

    props.form.setFieldValue("attachments", [...currentValue, newData]);
  };

  const handleOnUploadUrl = (title: string, url: string) => {
    const currentValue = props.form.getFieldValue("attachments") || [];

    console.log("currentValue : ", currentValue);
    setPreviewAllFiles((prev: AttachmentDetailItem[]) => {
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

    const linkItem = {
      title: title,
      url: url,
    };
    // setAttachmentItems((prev) => {
    //   return [
    //     ...prev,
    //     {
    //       type: props.type,
    //       attachmentType: "LINK",
    //       attachmentItems: linkItem,
    //     },
    //   ];
    // });

    props.form.setFieldValue("attachments", [
      ...currentValue,
      {
        type: props.type,
        attachmentType: "LINK",
        attachmentItems: linkItem,
      },
    ]);

    setShowUploadLinkForm(false);
  };

  const handleOnRemove = (item: AttachmentDetailItem) => {
    const newList = previewAllFiles.filter((prev) => prev !== item);

    setPreviewAllFiles(newList);
  };

  // useEffect(() => {
  //   props.form.setFieldsValue({ attachments: attachmentItems });
  // }, [attachmentItems]);

  // useEffect(() => {
  //   const files = previewAllFiles
  //     .filter(
  //       (item) =>
  //         item.attachmentType === AttachmentType.FILE ||
  //         item.attachmentType === AttachmentType.IMAGE,
  //     )
  //     .map((item) => (item.attachmentItems as UploadFile).originFileObj);

  //   const urls = previewAllFiles
  //     .filter((item) => item.attachmentType === AttachmentType.LINK)
  //     .map((item) => item.attachmentItems);

  //   if (props.type === "LECTURE") {
  //     props.form.setFieldValue("lecture_files", files);
  //     props.form.setFieldValue("lecture_urls", JSON.stringify(urls));
  //   } else {
  //     props.form.setFieldValue("record_files", files);
  //     props.form.setFieldValue("record_urls", JSON.stringify(urls));
  //   }
  // }, [previewAllFiles]);
  const handleBeforeUpload = (file: File) => {
    const isLt10M = file.size / 1024 / 1024 < 10;

    if (!isLt10M) {
      props.messageInstance.error("ขนาดไฟล์ต้องไม่เกิน 10MB");

      return Upload.LIST_IGNORE;
    }
    return true;
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 h-fit">
        <Form.Item name="attachments" hidden>
          <input />
        </Form.Item>
        <Button
          variant="secondary"
          iconSrc="/assets/material/link-small-icon.svg"
          type="button"
          className="rounded-4xl caption-bold !py-1 !px-4"
          onClick={() => setShowUploadLinkForm(true)}
        >
          เพิ่มลิงก์
        </Button>

        <UploadButton
          label="เพิ่มไฟล์"
          iconSrc="/assets/material/file-small-icon.svg"
          accept=".pdf,.docx,.doc,.txt,.xls,.xlsx,.ods,.ppt,.pptx,.csv,.zip"
          // name="attachments"
          onUpload={handleOnUpload}
          beforeUpload={handleBeforeUpload}
          attachmentType={AttachmentType.FILE}
          color="blue"
          noStyle
          size="small"
          //   loading={
          //     announcementSlice.postAnnouncementLoading ||
          //     announcementSlice.postFileLoading ||
          //     announcementSlice.postURLLoading
          //   }
        />
      </div>

      {showUploadLinkForm && (
        <MaterialUploadLinkForm
          handleOnUpload={handleOnUploadUrl}
          setShowUploadLinkForm={setShowUploadLinkForm}
        />
      )}

      {previewAllFiles.length > 0 && (
        <div className="mt-2">
          <PreviewListFile
            attachmentItems={previewAllFiles}
            handleOnRemove={handleOnRemove}
            isFullWidth
          />
        </div>
      )}
    </div>
  );
};

export default UploadSection;
