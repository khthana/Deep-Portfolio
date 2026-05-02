import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Popconfirm } from "antd";
import type { DataType } from "./score-weight-table";

type Props = {
  isEditing: (record: DataType) => boolean;
  edit: (record: DataType) => void;
  handleDelete: (key: React.Key) => void;
  handleSaveScoreWeight: (key: React.Key) => void;
  handleCancel: () => void;
};

const ScoreWeightColumn = (props: Props) => [
  {
    title: "หัวข้อ",
    dataIndex: "title",
    key: "title",
    render: (text: any) => <div className="caption-bold text-left">{text}</div>,
    align: "center",
    width: "50%",
    editable: true,
  },
  {
    title: "น้ำหนัก (%)",
    dataIndex: "weight",
    key: "weight",
    render: (text: any) => <div className="text-center">{text}</div>,
    align: "center",
    width: "30%",
    editable: true,
  },
  {
    dataIndex: "operation",
    width: "20%",
    render: (_: any, record: DataType) => {
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
          <CheckOutlined
            onClick={() => props.handleSaveScoreWeight(record.key)}
          />
          <CloseOutlined onClick={props.handleCancel} />
        </div>
      );
    },
  },
];

export default ScoreWeightColumn;
