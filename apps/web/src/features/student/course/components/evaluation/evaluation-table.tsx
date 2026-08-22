import type { ClassworkCategory } from "@deep-portfolio/api-types";
import { Form, Table, type TableProps } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../../stores/stores";
import { useEffect, useState } from "react";
import EditableCell from "../../../../../components/input/table/editable-cell";
import EvaluationColumn from "./evaluation-column";
import WhiteContainer from "../../../../../components/container/white-container";
import type { GetStudentEvaluationListParams } from "../../types/course-type";
import type { StudentActivityStatusDB } from "@deep-portfolio/api-types";
import { fetchStudentEvaluationList } from "../../stores/course-action";

export type DataType = {
  key: string;
  no: number;
  title: string;
  category: ClassworkCategory;
  // The column's own four values, copied straight off the row (#68), where it
  // used to say `string`. The `| null` is the table's, not the response's —
  // the map below always fills it, and the cell draws a dash for a value that
  // is missing.
  status: StudentActivityStatusDB | null;
  score: number | null;
  full_score: number | null;
  max_score: number | null;
  min_score: number | null;
  mean_score: number | null;
  id: number;
  isNew?: boolean;
};

type ColumnTypes = Exclude<TableProps<DataType>["columns"], undefined>;

const EvaluationTable = () => {
  const [form] = Form.useForm();

  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.home);
  const studentCourseSlice = useSelector(
    (state: RootState) => state.studentCourse,
  );

  const [data, setData] = useState<DataType[]>([]);

  const handleFetchData = async () => {
    if (!homeSlice.studentId || !studentCourseSlice.selectedCourse) return;

    const params: GetStudentEvaluationListParams = {
      student_id: homeSlice.studentId,
      section_id: studentCourseSlice.selectedCourse.section_id,
    };

    const { data } = await dispatch(
      fetchStudentEvaluationList(params),
    ).unwrap();

    const mappedData = data.evaluations.map((classwork, dataIndex) => {
      // Classroom work has no score column at all, so the response has no such
      // keys on that kind of row — which is why reading them takes the row's
      // own `type` first (#68). An activity nobody has been marked for does
      // carry them, as null. The table draws a dash either way, so flatten the
      // two here.
      const activityRow = classwork.type === "activity" ? classwork : null;

      return {
        key: classwork.activity_id.toString(),
        no: dataIndex + 1,
        title: classwork.activity_name,
        score: activityRow?.score ?? null,
        full_score: activityRow?.full_score ?? null,
        max_score: activityRow?.max_score ?? null,
        min_score: activityRow?.min_score ?? null,
        mean_score: activityRow?.mean_score ?? null,
        category: classwork.type,
        status: classwork.status,
        id: classwork.id,
      };
    });

    setData(mappedData);
  };

  const columns = EvaluationColumn();

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        inputType: "text",
        dataIndex: col.dataIndex,
        title: col.title,
        require: col.dataIndex === "title" ? true : false,
      }),
    };
  });

  useEffect(() => {
    handleFetchData();
  }, [studentCourseSlice.selectedCourse]);

  return (
    <WhiteContainer>
      <div className="body-bold-1 pb-5 border-b border-light-grey">
        กิจกรรมการประเมิน
      </div>

      <Form form={form} component={false}>
        <div>
          <Table<DataType>
            components={{
              body: { cell: EditableCell<DataType> },
            }}
            bordered
            dataSource={data}
            columns={mergedColumns as ColumnTypes}
            pagination={false}
            className="ical-align-top-table custom-table orange"
            scroll={{ x: "1200px" }}
          />
        </div>
      </Form>
    </WhiteContainer>
  );
};

export default EvaluationTable;
