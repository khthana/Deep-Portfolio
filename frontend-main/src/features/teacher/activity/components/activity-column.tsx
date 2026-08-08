import type { DataType } from "./activity-table";
import {
  activityTypeLabel,
  type activityType,
} from "../types/activity-type.type";
import { generatePath, useParams } from "react-router-dom";
import { paths } from "../../../../routes/paths.config";
import { EditOutlined } from "@ant-design/icons";
import { Tooltip, Popconfirm } from "antd";

type Props = {
  handleDelete?: (key: React.Key) => void;
  canDelete?: boolean;
};

const ActivityColumn = (props: Props) => [
  {
    title: "ลำดับที่",
    dataIndex: "no",
    key: "no",
    align: "center",
    width: 100,
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
    width: 300,
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
    width: 182,
  },
  {
    title: "กำหนดส่ง",
    dataIndex: "deadline",
    key: "deadline",
    render: (text: string) => (
      <div className="text-left">{text ? text : "-"}</div>
    ),
    align: "center",
    width: 182,

    // editable: true,
  },
  {
    title: "งานเดี่ยว/กลุ่ม",
    dataIndex: "type",
    key: "type",
    render: (text: activityType) => (
      <div>{text ? activityTypeLabel[text] : "-"}</div>
    ),
    align: "center",
    width: 150,
    // editable: true,
  },
  {
    title: "ประเภท",
    dataIndex: "category",
    key: "category",
    render: (text: string) => (
      <div className="text-left">{text ? text : "-"}</div>
    ),
    align: "center",
    width: 150,
    // editable: true,
  },
  {
    title: "ส่งแล้ว",
    dataIndex: "submitted_count",
    key: "submitted_count",
    align: "center",
    width: 120,
    // editable: true,
  },
  {
    title: "ค้างตรวจ",
    dataIndex: "pending_count",
    key: "pending_count",
    align: "center",
    width: 120,
    // editable: true,
  },
  {
    dataIndex: "operation",
    width: 120,
    render: (_: any, record: DataType) => {
      const { secId } = useParams();

      const path = generatePath(paths.teacher.course.activity.detail, {
        secId: secId,
        activityId: record.id,
      });
      const editPath = generatePath(paths.teacher.course.activity.edit, {
        secId: secId,
        activityId: record.id,
      });

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

          {props.canDelete && (
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
          )}
        </div>
      );
    },
  },
];

export default ActivityColumn;
