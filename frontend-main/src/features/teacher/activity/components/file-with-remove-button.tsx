import {
  DeleteOutlined,
  FilePdfOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import type { FileDetail } from "../../../../types/attachment-type.type";
import type { AppDispatch } from "../../../../stores/stores";
import { useDispatch } from "react-redux";
import { message, Popconfirm, type FormInstance } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import type { Dispatch, SetStateAction } from "react";
import { getFile } from "../../../../utils/get-file";

type Props = {
  fileDetail: FileDetail;

  setRemoveFile?: Dispatch<SetStateAction<number[]>>;
  setOldFiles?: Dispatch<SetStateAction<FileDetail[]>>;
};

const FileWithRemoveButton = (props: Props) => {
  const imgType = ["JPG", "JPEG", "PNG"];

  const handleOnRemove = async () => {
    try {
      if (!props.setRemoveFile || !props.setOldFiles) return;

      props.setOldFiles((prev) =>
        prev.filter((file) => file !== props.fileDetail),
      );
      props.setRemoveFile((prev) => [...prev, props.fileDetail.attachment_id]);
    } catch (error) {}
  };

  return (
    <div className="w-2/5 flex justify-between">
      <div className="flex gap-2 items-center">
        <div>
          {imgType.includes(props.fileDetail.file_type) ? (
            <PictureOutlined />
          ) : (
            <FilePdfOutlined />
          )}
        </div>
        <a
          href={getFile(props.fileDetail.file_path)}
          target="_blank"
          rel="noreferrer"
          className="!underline"
        >
          {props.fileDetail.title}
        </a>
      </div>

      <div className="flex gap-2 items-center">
        <div className="text-primary-grey text-sm">
          {(props.fileDetail.file_size / 1024).toFixed(2)} KB
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
    </div>
  );
};

export default FileWithRemoveButton;
