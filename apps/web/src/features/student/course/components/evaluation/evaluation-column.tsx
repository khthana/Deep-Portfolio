import type { ClassworkCategory } from "@deep-portfolio/api-types";
import { generatePath, useParams } from "react-router-dom";
import { paths } from "../../../../../routes/paths.config";
import { formatScore } from "../../../../../utils/format-score";
import type { DataType } from "./evaluation-table";
import {
  classworkCategoryLabel,
  ClassworkStatus,
  classworkStatusLabel,
} from "../../types/course-type";

const EvaluationColumn = () => {
  // Read once here rather than inside a cell's `render`: antd calls `render`
  // once per row, so a hook in there is called a different number of times
  // from one render to the next.
  const { secId } = useParams();

  return [
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
    // Pinned, not fixed (#69). What arrives here is the `status` column, whose
    // four values are NOT_SUBMITTED, SUBMITTED, GRADING and GRADED — while
    // `classworkStatusLabel` is keyed by the classwork list's four, which have
    // LATE where the column has GRADING. So a GRADING row would draw an empty
    // cell rather than a dash, because the string is truthy and the lookup is
    // not. Nothing in the API writes GRADING today, and what it should read in
    // Thai is a wording decision, so #69 owns both.
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (text: ClassworkStatus) => (
        <div className="text-left">
          {text ? classworkStatusLabel[text] : "-"}
        </div>
      ),
      align: "center",
      width: 140,
    },
    // The score columns go through formatScore, which dashes a null and prints
    // a 0. `text ? text : "-"` dashed both, so a student who scored 0 was shown
    // the same cell as one who has not been marked — and since #28 the class
    // statistics arrive as null until the marking starts, which is the same
    // difference one column to the left.
    {
      title: "คะแนนที่ได้",
      dataIndex: "score",
      key: "score",
      render: (text: number | null) => <div>{formatScore(text)}</div>,
      align: "center",
      width: 112,
    },
    {
      title: "คะแนนเต็ม",
      dataIndex: "full_score",
      key: "full_score",
      render: (text: number | null) => <div>{formatScore(text)}</div>,
      align: "center",
      width: 112,
    },

    {
      title: "max",
      dataIndex: "max_score",
      key: "max_score",
      render: (text: number | null) => <div>{formatScore(text)}</div>,
      align: "center",
      width: 112,
    },
    {
      title: "min",
      dataIndex: "min_score",
      key: "min_score",
      render: (text: number | null) => <div>{formatScore(text)}</div>,
      align: "center",
      width: 112,
    },
    {
      title: "mean",
      dataIndex: "mean_score",
      key: "mean_score",
      render: (text: number | null) => <div>{formatScore(text)}</div>,
      align: "center",
      width: 112,
    },

    {
      dataIndex: "operation",
      width: 150,
      render: (_: any, record: DataType) => {
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
};

export default EvaluationColumn;
