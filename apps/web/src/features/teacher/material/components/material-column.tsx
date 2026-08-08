import {
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { AttachmentItemsType, DataType } from "./material-table";
import UploadSection from "./upload-section";
import type { AttachmentDetailResp } from "../../../../types/attachment-type.type";
import { Spin, type FormInstance } from "antd";
import type { Dispatch, SetStateAction } from "react";
import FileWithRemoveButton from "./file-with-remove-button";
import UrlWithRemoveButton from "./url-with-remove-button";
import type { MessageInstance } from "antd/es/message/interface";
import { getFile } from "../../../../utils/get-file";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../stores/stores";

type Props = {
  isLoading: boolean;
  isEditing: (record: DataType) => boolean;
  edit: (record: DataType) => void;
  handleDelete: (key: React.Key) => void;
  handleSave: (key: React.Key) => void;
  handleCancel: () => void;
  handleFetchData: () => void;
  form: FormInstance<{ attachments: AttachmentItemsType[] }>;
  setAttachmentItems: Dispatch<SetStateAction<AttachmentItemsType[]>>;
  messageInstance: MessageInstance;
};

const MaterialColumn = (props: Props) => [
  {
    title: "สัปดาห์ที่",
    dataIndex: "week",
    key: "week",
    render: (text: number) => (
      <div className="caption-bold">{text ? text : "-"}</div>
    ),
    align: "center",
    width: 112,
  },
  {
    title: "หัวข้อ",
    dataIndex: "title",
    key: "title",
    render: (text: string) => (
      <div className="text-left">{text ? text : "-"}</div>
    ),
    align: "center",
    editable: false,
    width: 370,
  },
  {
    title: "เอกสารประกอบการเรียน",
    dataIndex: "lecture",
    key: "lecture",
    render: (attachments: AttachmentDetailResp, record: DataType) => {
      const editable = props.isEditing(record);
      return editable ? (
        <div className="flex flex-col gap-1 w-100">
          {attachments.file.length > 0 &&
            attachments.file.map((file) => (
              <FileWithRemoveButton
                key={file.attachment_id}
                fileDetail={file}
                handleFetchData={props.handleFetchData}
                messageInstance={props.messageInstance}
                form={props.form}
              />
            ))}
          {attachments.url.length > 0 &&
            attachments.url.map((url) => (
              <UrlWithRemoveButton
                key={url.attachment_id}
                urlDetail={url}
                handleFetchData={props.handleFetchData}
                messageInstance={props.messageInstance}
              />
            ))}
          <UploadSection
            type="LECTURE"
            form={props.form}
            messageInstance={props.messageInstance}
          />
        </div>
      ) : (
        <div className="text-left flex flex-col w-100">
          {attachments.file.length > 0 &&
            attachments.file.map((file) => (
              <a
                href={getFile(file.file_path)}
                target="_blank"
                download={file.title}
                key={file.attachment_id}
                className="!underline"
              >
                {file.title}
              </a>
            ))}

          {attachments.url.length > 0 &&
            attachments.url.map((url) => (
              <a
                href={url.url}
                target="_blank"
                key={url.attachment_id}
                className="!underline"
              >
                {url.title}
              </a>
            ))}
        </div>
      );
    },
    align: "center",
    width: 400,
  },
  {
    title: "บันทึกการสอน",
    dataIndex: "record",
    key: "record",
    render: (attachments: AttachmentDetailResp, record: DataType) => {
      const editable = props.isEditing(record);
      return editable ? (
        <div className="flex flex-col gap-1 w-100">
          {attachments.file.length > 0 &&
            attachments.file.map((file) => (
              <FileWithRemoveButton
                key={file.attachment_id}
                fileDetail={file}
                handleFetchData={props.handleFetchData}
                messageInstance={props.messageInstance}
                form={props.form}
              />
            ))}
          {attachments.url.length > 0 &&
            attachments.url.map((url) => (
              <UrlWithRemoveButton
                key={url.attachment_id}
                urlDetail={url}
                handleFetchData={props.handleFetchData}
                messageInstance={props.messageInstance}
              />
            ))}
          <UploadSection
            type="RECORD"
            form={props.form}
            messageInstance={props.messageInstance}
          />
        </div>
      ) : (
        <div className="text-left flex flex-col w-100">
          {attachments.file.length > 0 &&
            attachments.file.map((file) => (
              <a
                href={getFile(file.file_path)}
                target="_blank"
                download={file.title}
                key={file.attachment_id}
                className="!underline"
              >
                {file.title}
              </a>
            ))}
          {attachments.url.length > 0 &&
            attachments.url.map((url) => (
              <a
                href={url.url}
                target="_blank"
                key={url.attachment_id}
                className="!underline"
              >
                {url.title}
              </a>
            ))}
        </div>
      );
    },
    align: "center",
    width: 400,
  },
  {
    dataIndex: "operation",
    width: 120,
    render: (_: any, record: DataType) => {
      // const metarialSlice = useSelector(
      //   (state: RootState) => state.teacherCourseMaterial,
      // );

      const editable = props.isEditing(record);

      return !editable ? (
        <div className="flex gap-4 justify-center">
          <img
            src="/assets/course/edit-icon.svg"
            alt="edit icon"
            className="cursor-pointer"
            onClick={() => props.edit(record)}
          />
        </div>
      ) : props.isLoading ? (
        <div className="flex justify-center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </div>
      ) : (
        <div className="flex gap-4 justify-center">
          <CheckOutlined onClick={() => props.handleSave(record.key)} />
          <CloseOutlined onClick={props.handleCancel} />
        </div>
      );
    },
  },
];

export default MaterialColumn;
