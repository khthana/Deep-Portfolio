import {
  type SubmissionStatus,
} from "../types/activity-type.type";
import { generatePath, useParams } from "react-router-dom";
import { paths } from "../../../../routes/paths.config";
import type { DataType } from "../pages/teacher-activity-detail-page";
import StatusChip from "./status-chip";

type Props = {
  isEditing: (record: DataType) => boolean;
  edit: (record: DataType) => void;
  handleDelete: (key: React.Key) => void;
  handleSave: (key: React.Key) => void;
  handleCancel: () => void;
};

const StudentWorkColumn = (props: Props) => {
  // Read once here rather than inside a cell's `render`: antd calls `render`
  // once per row, so a hook in there is called a different number of times
  // from one render to the next.
  const { secId, activityId } = useParams();

  return [
    {
      title: "ลำดับที่",
      dataIndex: "no",
      key: "no",
      align: "center",
      width: 100,
    },
    {
      title: "เวลาส่ง",
      dataIndex: "submitted_date",
      key: "submitted_date",
      render: (text: string) => (
        <div className="text-left">{text ? text : "-"}</div>
      ),
      align: "center",
      editable: true,
      width: 240,
    },
    {
      title: "รหัสนักศึกษา",
      dataIndex: "code",
      key: "code",
      render: (codes: string[]) => (
        <div className="text-left">
          {codes.length > 0 ? codes.map((code) => <div>{code}</div>) : "-"}
        </div>
      ),
      align: "center",
      editable: true,
      width: 130,
    },
    {
      title: "ชื่อ - สกุล",
      dataIndex: "name",
      key: "name",
      render: (names: string[]) => (
        <div className="text-left">
          {names.length > 0 ? names.map((name) => <div>{name}</div>) : "-"}
        </div>
      ),
      align: "center",
      width: 300,

      // editable: true,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (text: SubmissionStatus) => (
        <div className="flex justify-center">
          <StatusChip status={text} />
        </div>
      ),
      align: "center",
      width: 160,
      // editable: true,
    },
    {
      title: "คะแนน",
      dataIndex: "score",
      key: "score",
      align: "center",
      render: (text: number | null) => <div>{text ? text : "-"}</div>,
      width: 100,
      // editable: true,
    },
    {
      title: "ความคิดเห็น",
      dataIndex: "feedback",
      key: "feedback",
      align: "center",
      render: (text: string | null) => (
        <div className="text-left">{text ? text : "-"}</div>
      ),
      width: 300,

      // editable: true,
    },
    {
      title: "หมายเหตุ",
      dataIndex: "remark",
      key: "remark",
      align: "center",
      render: (text: string | null) => (
        <div className="text-left">{text ? text : "-"}</div>
      ),
      width: 240,

      // editable: true,
    },
    {
      dataIndex: "operation",
      width: 80,
      render: (_: any, record: DataType) => {
        const path = generatePath(paths.teacher.course.activity.grading, {
          secId: secId,
          activityId: activityId,
          workId: record.id,
        });

        return (
          <div className="text-center">
            <a href={path}>ดูงาน</a>
          </div>
        );
      },
    },
  ];
};

export default StudentWorkColumn;
