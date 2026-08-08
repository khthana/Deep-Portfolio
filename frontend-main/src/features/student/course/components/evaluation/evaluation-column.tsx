import { generatePath, useParams } from "react-router-dom";
import { paths } from "../../../../../routes/paths.config";
import type { DataType } from "./evaluation-table";
import {
  classworkCategoryLabel,
  ClassworkStatus,
  classworkStatusLabel,
  type ClassworkCategory,
} from "../../types/course-type";

const EvaluationColumn = () => [
  {
    title: "กิจกรรม",
    dataIndex: "title",
    key: "title",
    render: (text: string) => (
      <div className="text-left caption-bold">{text ? text : "-"}</div>
    ),
    align: "center",
    editable: true,
    width: 300,
  },
  {
    title: "ประเภท",
    dataIndex: "category",
    key: "category",
    render: (text: ClassworkCategory) => (
      <div className="text-left">
        {text ? classworkCategoryLabel[text] : "-"}
      </div>
    ),
    align: "center",
    width: 200,
  },
  {
    title: "สถานะ",
    dataIndex: "status",
    key: "status",
    render: (text: ClassworkStatus) => (
      <div className="text-left">{text ? classworkStatusLabel[text] : "-"}</div>
    ),
    align: "center",
    width: 140,
  },
  {
    title: "คะแนนที่ได้",
    dataIndex: "score",
    key: "score",
    render: (text: number) => <div>{text ? text : "-"}</div>,
    align: "center",
    width: 112,
  },
  {
    title: "คะแนนเต็ม",
    dataIndex: "full_score",
    key: "full_score",
    render: (text: number) => <div>{text ? text : "-"}</div>,
    align: "center",
    width: 112,
  },

  {
    title: "max",
    dataIndex: "max_score",
    key: "max_score",
    render: (text: number) => <div>{text ? text : "-"}</div>,
    align: "center",
    width: 112,
  },
  {
    title: "min",
    dataIndex: "min_score",
    key: "min_score",
    render: (text: number) => <div>{text ? text : "-"}</div>,
    align: "center",
    width: 112,
  },
  {
    title: "mean",
    dataIndex: "mean_score",
    key: "mean_score",
    render: (text: number) => <div>{text ? text : "-"}</div>,
    align: "center",
    width: 112,
  },

  {
    dataIndex: "operation",
    width: 150,
    render: (_: any, record: DataType) => {
      const { secId } = useParams();
      const path = generatePath(paths.student.course.evaluation.detail, {
        secId: secId,
        category: record.category,
        activityId: record.id,
      });

      return (
        <>
          {record.status === "GRADED" ? (
            <div className="text-primary-orange underline">
              <a href={path} className="!text-primary-orange">
                ผลการประเมิน
              </a>
            </div>
          ) : (
            <div>รอผลการประเมิน</div>
          )}
        </>
      );
    },
  },
];

export default EvaluationColumn;
