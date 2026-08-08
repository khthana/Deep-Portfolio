import { Dropdown, Popconfirm, type UploadFile } from "antd";
import Button from "../../../../../components/button/button";
import type { UploadChangeParam } from "antd/es/upload";
import type { AttachmentDetailItem } from "../../../../teacher/announcement/types/announement-type";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";
import { AttachmentType } from "../../../../../types/attachment-type.type";
import { useState, type Dispatch, type SetStateAction } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import UploadClassworkButton from "../../../../../components/button/upload-classwork-button";

type Props = {
  setPreviewAllFiles: Dispatch<SetStateAction<AttachmentDetailItem[]>>;
  messageApi: MessageInstance;
  handleOnSubmit: () => void;
  isFileEmpty: boolean;
};

const SubmitClassworkForm = (props: Props) => {
  const courseSlice = useSelector((state: RootState) => state.studentCourse);

  const handleOnUpload = (
    info: UploadChangeParam<UploadFile>,
    type: AttachmentType,
  ) => {
    const { file } = info;
    // ป้องกันการเรียกใช้ function 2 รอบ
    if (file.status !== "done" || type === AttachmentType.LINK) return;

    if (info.file.size && info.file.size < 10 * 1024 * 1024) {
      props.setPreviewAllFiles((prev: AttachmentDetailItem[]) => {
        return [
          ...prev,
          {
            attachmentType: type,
            attachmentItems: info.file,
          },
        ];
      });

      props.messageApi.success("เพิ่มไฟล์สำเร็จ");
    } else {
      props.messageApi.error("ขนาดไฟล์ต้องไม่เกิน 10MB");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* <UploadClassworkButton
        name="files"
        onUpload={handleOnUpload}
        attachmentType={AttachmentType.FILE}
        loading={
          courseSlice.postSubmitActivityLoading ||
          courseSlice.postSubmitLearningActivityLoading
        }
      /> */}

      <UploadClassworkButton
        onUpload={handleOnUpload}
        setPreviewAllFiles={props.setPreviewAllFiles}
      />
      <Popconfirm
        title="ยืนยันการส่งงาน"
        description="คุณต้องการส่งงานหรือไม่?"
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        onConfirm={props.handleOnSubmit}
      >
        <Button
          className="rounded-xl"
          loading={
            courseSlice.postSubmitActivityLoading ||
            courseSlice.postSubmitLearningActivityLoading
          }
        >
          ส่งงาน
        </Button>
      </Popconfirm>
      {props.isFileEmpty && (
        <div className="text-primary-red caption-bold text-xs text-right">
          กรุณาแนบไฟล์งาน
        </div>
      )}
    </div>
  );
};

export default SubmitClassworkForm;
