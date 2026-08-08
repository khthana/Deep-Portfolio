import { useParams, generatePath } from "react-router-dom";
import { paths } from "../../../../routes/paths.config";
import type { DataType } from "./learning-activity-table";
import { EditOutlined } from "@ant-design/icons";
import { Tooltip, Popconfirm } from "antd";

type Props = {
  isEditing: (record: DataType) => boolean;
  edit: (record: DataType) => void;
  handleDelete: (key: React.Key) => void;
  handleSave: (key: React.Key) => void;
  handleCancel: () => void;
};

const LearningActivityColumn = (props: Props) => [
  {
    title: "หัวข้อ",
    dataIndex: "title",
    key: "title",
    render: (text: string) => (
      <div className="text-left">{text ? text : "-"}</div>
    ),
    align: "center",
    editable: true,
    width: 375,
  },
  {
    title: "วันประกาศ",
    dataIndex: "announcement_date",
    key: "announcement_date",
    render: (text: string) => (
      <div className="text-left">{text ? text : "-"}</div>
    ),
    align: "center",
    editable: true,
  },
  {
    title: "กำหนดส่ง",
    dataIndex: "deadline",
    key: "deadline",
    render: (text: string) => (
      <div className="text-left">{text ? text : "-"}</div>
    ),
    align: "center",

    // editable: true,
  },
  {
    title: "ส่งแล้ว",
    dataIndex: "submitted_count",
    key: "submitted_count",
    align: "center",
    // editable: true,
  },
  {
    title: "ค้างตรวจ",
    dataIndex: "pending_count",
    key: "pending_count",
    align: "center",
    // editable: true,
  },

  {
    title: "สัปดาห์ที่",
    dataIndex: "week",
    key: "week",
    render: (text: number) => <div>{text !== 0 ? text : "-"}</div>,
    align: "center",
    width: 152,
    // editable: true,
  },
  {
    dataIndex: "operation",
    width: 120,
    render: (_: any, record: DataType) => {
      const { secId } = useParams();
      const path = generatePath(paths.teacher.course.learningActivity.detail, {
        secId: secId,
        activityId: record.id,
      });
      const editPath = generatePath(
        paths.teacher.course.learningActivity.edit,
        {
          secId: secId,
          activityId: record.id,
        },
      );

      return (
        <div className="flex gap-2 justify-center items-center">
          <Tooltip title="ดูงานทั้งหมด">
            <a href={path}>
              <img
                src="/assets/course/eye-icon.svg"
                alt="eye icon"
                width={20}
              />
            </a>
          </Tooltip>

          <Tooltip title="แก้ไขรายละเอียด">
            <a href={editPath}>
              <EditOutlined className="!text-primary-black" />
            </a>
          </Tooltip>

          <Tooltip title="ลบกิจกรรม">
            <Popconfirm
              title="ต้องการลบใช่หรือไม่"
              onConfirm={() =>
                props.handleDelete && props.handleDelete(record.key)
              }
            >
              <img
                src="/assets/course/delete-icon.svg"
                alt="delete icon"
                className="cursor-pointer"
                width={16}
              />
            </Popconfirm>
          </Tooltip>
        </div>
      );
    },
  },
];

export default LearningActivityColumn;
