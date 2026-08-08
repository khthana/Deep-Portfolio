import type { TableProps } from "antd";
import StatusChip from "./status-chip";
import type { AssignmentHeaderColumnType } from "../types/gradebook-type.type";

const PersonGradebookColumn = (activities: AssignmentHeaderColumnType[]) => {
  const personGradebookColumns: TableProps<any>["columns"] = [
    {
      title: "ลำดับที่",
      dataIndex: "no",
      key: "no",
      align: "center",
      width: 100,
      // fixed: "left",
    },
    {
      title: "รหัสนักศึกษา",
      dataIndex: "student_id",
      key: "student_id",
      align: "center",
      render: (text: string) => (
        <div className="text-left">{text ? text : "-"}</div>
      ),
      width: 150,
      // fixed: "left",
    },
    {
      title: "ชื่อ - สกุล",
      dataIndex: "student_name",
      key: "student_name",
      align: "center",
      render: (text: string) => (
        <div className="text-left">{text ? text : "-"}</div>
      ),
      width: 250,
      // fixed: "left",
    },
    {
      title: "การส่งงาน",
      dataIndex: "submit_status",
      key: "submit_status",
      width: 220,
      align: "center",
      render: (value: any) => (
        <div className="flex justify-center">
          <StatusChip status={value} />
        </div>
      ),
    },
    {
      title: (
        <div>
          <div>คะแนนรวม</div>
          <div>
            {activities.map((a) => a.full_score).reduce((a, b) => a + b, 0)}{" "}
            คะแนน
          </div>
        </div>
      ),
      dataIndex: "total_score",
      key: "total_score",
      align: "center",
      width: 120,
    },
  ];

  const assignmentCols: TableProps<any>["columns"] = activities.map((a) => ({
    title: (
      <div className="flex flex-col items-center">
        <div>{a.activity_name}</div>
        <div>{a.full_score} คะแนน</div>
      </div>
    ),
    dataIndex: ["activities", a.activity_id],
    key: `ass-${a.activity_id}`,
    align: "center",
    render: (_: any, row: any) => {
      const found = row.activities.find(
        (x: any) => x.activity_id === a.activity_id,
      );
      if (!found) return "-";

      const label = found?.score
        ? found.score
        : found.status === "SUBMITTED"
          ? "รอตรวจ"
          : "-";

      return <div>{label}</div>;
    },
  }));

  return [...personGradebookColumns, ...assignmentCols];
};

export default PersonGradebookColumn;
