import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Popconfirm } from "antd";
import type { DataType } from "./lesson-plan-table";

type Props = {
  isEditing: (record: DataType) => boolean;
  edit: (record: DataType) => void;
  handleDelete: (key: React.Key) => void;
  handleSave: (key: React.Key) => void;
  handleCancel: () => void;
};

const LessonPlanColumn = (props: Props) => [
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
    editable: true,
    width: 370,
  },
  {
    title: "เนื้อหา",
    dataIndex: "detail",
    key: "detail",
    render: (text: string) => (
      <div className="text-left">{text ? text : "-"}</div>
    ),
    align: "center",
    editable: true,
    width: 400,
  },
  {
    title: "กิจกรรม",
    dataIndex: "activity",
    key: "activity",
    render: (activities: string[]) => (
      <div className="text-left">
        {activities.length > 0
          ? activities.map((activity) => <div>- {activity}</div>)
          : "-"}
      </div>
    ),
    align: "center",
    width: 300,
    // editable: true,
  },
  {
    title: "หมายเหตุ",
    dataIndex: "remark",
    key: "remark",
    render: (text: string) => (
      <div className="text-left">{text ? text : "-"}</div>
    ),
    align: "center",
    editable: true,
    width: 180,
  },
  {
    dataIndex: "operation",
    width: 120,
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
          <CheckOutlined onClick={() => props.handleSave(record.key)} />
          <CloseOutlined onClick={props.handleCancel} />
        </div>
      );
    },
  },
];

export default LessonPlanColumn;
