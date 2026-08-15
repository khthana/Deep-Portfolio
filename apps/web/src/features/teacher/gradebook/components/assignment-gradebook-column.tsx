import { formatScore } from "../../../../utils/format-score";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";

// type Props = {
//   isEditing: (record: GradebookPerActivityDataType) => boolean;
//   edit: (record: GradebookPerActivityDataType) => void;
//   handleDelete: (key: React.Key) => void;
//   handleSave: (key: React.Key) => void;
//   handleCancel: () => void;
// };

const AssignmentGradebookColumn = () => [
  {
    title: "ลำดับที่",
    dataIndex: "no",
    key: "no",
    render: (text: number) => (
      <div className="caption-bold">{text ? text : "-"}</div>
    ),
    align: "center",
    width: 100,
  },
  {
    title: "กิจกรรมการประเมิน",
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
    title: "กำหนดส่ง",
    dataIndex: "deadline",
    key: "deadline",
    render: (text: string | null) => (
      <div className="text-left">
        {text ? convertDateToThaiFormat(text) : "-"}
      </div>
    ),
    align: "center",
    width: 180,
    // width: 182,
  },
  {
    title: "ส่งแล้ว",
    dataIndex: "submitted_count",
    key: "submitted_count",
    render: (text: number) => <div>{text ? text : "-"}</div>,
    align: "center",
    width: 120,
  },
  {
    title: "ประเมินแล้ว",
    dataIndex: "graded_count",
    key: "graded_count",
    render: (text: number) => <div>{text ? text : "-"}</div>,
    align: "center",
    width: 120,
  },
  {
    title: "ยังไม่ส่ง",
    dataIndex: "not_submitted_count",
    key: "not_submitted_count",
    render: (text: number) => <div>{text ? text : "-"}</div>,
    align: "center",
    width: 120,
  },
  // The three statistics arrive as null while nobody in the section has been
  // marked, so they are rendered rather than left to antd, which would print an
  // empty cell (#28). A marked 0 still shows as 0.
  {
    title: "Max",
    dataIndex: "max",
    key: "max",
    render: (text: number | null) => <div>{formatScore(text)}</div>,
    align: "center",
    width: 120,

    // width: 182,
    // editable: true,
  },
  {
    title: "Min",
    dataIndex: "min",
    key: "min",
    render: (text: number | null) => <div>{formatScore(text)}</div>,
    align: "center",
    width: 120,

    // editable: true,
  },
  {
    title: "Mean",
    dataIndex: "mean",
    key: "mean",
    render: (text: number | null) => <div>{formatScore(text)}</div>,
    align: "center",
    width: 120,

    // editable: true,
  },
];

export default AssignmentGradebookColumn;
