import { Popconfirm } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import type { DataType } from "./thesis-file-table";
import {
  mockThesisAttachmentIcon,
  mockThesisAttachmentLabel,
  type MockThesisAttachmentType,
} from "../../types/experience-skill-type.type";

type Props = {
  isEditing: (record: DataType) => boolean;
  edit: (record: DataType) => void;
  handleDelete: (key: React.Key) => void;
  handleSave: (key: React.Key) => void;
  handleCancel: () => void;
};

const ThesisFileColumn = (props: Props) => [
  {
    title: "ลำดับที่",
    dataIndex: "no",
    key: "no",
    render: (text: string | number) => (
      <div className="caption-bold">{text}</div>
    ),
    align: "center",
    width: 112,
  },
  {
    title: "ประเภท",
    dataIndex: "type",
    key: "type",
    render: (text: MockThesisAttachmentType) => (
      <div className="text-left">{mockThesisAttachmentLabel[text]}</div>
    ),

    align: "center",
    width: 112,
    editable: true,
  },
  {
    title: "ไฟล์แนบ",
    dataIndex: "attachment",
    key: "attachment",
    render: (text: string, record: DataType) => (
      <div className="text-left text-primary-orange flex items-center gap-2">
        <div>
          <img src={`${mockThesisAttachmentIcon[record.type]}`} alt="icon" />
        </div>
        <div className="border-b border-primary-orange cursor-pointer">
          {text}
        </div>
      </div>
    ),

    align: "center",
    editable: true,
  },
  {
    dataIndex: "operation",
    width: 140,
    render: (_: unknown, record: DataType) => {
      const editable = props.isEditing(record);

      return !editable ? (
        <div className="flex gap-4 justify-center">
          <img
            src="/assets/course/edit-icon.svg"
            alt="edit icon"
            className="cursor-pointer"
            onClick={() => props.edit(record)}
          />
          <Popconfirm
            title="ต้องการลบใช่หรือไม่"
            onConfirm={() => props.handleDelete(record.key)}
          >
            <img
              src="/assets/course/delete-icon.svg"
              alt="delete icon"
              className="cursor-pointer"
            />
          </Popconfirm>
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

export default ThesisFileColumn;
