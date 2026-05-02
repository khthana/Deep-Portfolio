import { Dropdown, Upload, type MenuProps, type UploadFile } from "antd";
import React, { useState, type Dispatch, type SetStateAction } from "react";
import Button from "./button";
import { FilePdfOutlined, PaperClipOutlined } from "@ant-design/icons";
import type { UploadChangeParam } from "antd/es/upload";
import { AttachmentType } from "../../types/attachment-type.type";
import UploadLinkModal from "../input/upload-link-modal";
import type { AttachmentDetailItem } from "../../features/teacher/announcement/types/announement-type";

type Props = {
  onUpload: (info: UploadChangeParam<UploadFile>, type: AttachmentType) => void;
  setPreviewAllFiles: Dispatch<SetStateAction<AttachmentDetailItem[]>>;
};
const UploadClassworkButton = (props: Props) => {
  const [openModal, setOpenModal] = useState<boolean>(false);

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <div className="flex gap-2 caption-bold text-primary-black">
          <PaperClipOutlined />
          <div>เพิ่มลิงก์</div>
        </div>
      ),
      onClick: () => setOpenModal(true),
    },
    {
      key: "2",
      label: (
        <Upload
          {...props}
          accept=".pdf,.docx,.doc,.txt,.xls,.xlsx,.ods,.ppt,.pptx,.csv .png,.jpg,.jpeg,.zip"
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
          <div className="flex gap-2 caption-bold text-primary-black">
            <FilePdfOutlined />

            <div>เพิ่มไฟล์</div>
          </div>
        </Upload>
      ),
    },
  ];

  return (
    <>
      <Dropdown menu={{ items }} trigger={["click"]}>
        <Button
          variant="secondary"
          iconSrc="/assets/course/add-icon.svg"
          type="button"
          // loading={props.loading}
          className="!font-medium rounded-xl !w-full"
        >
          เพิ่มไฟล์งาน
        </Button>
      </Dropdown>

      <UploadLinkModal
        open={openModal}
        setOpen={setOpenModal}
        setPreviewAllFiles={props.setPreviewAllFiles}
      />
    </>
  );
};

export default UploadClassworkButton;
