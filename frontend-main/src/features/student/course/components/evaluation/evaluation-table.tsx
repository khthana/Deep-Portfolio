import { Form, message, Table, type TableProps } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../../stores/stores";
import { useEffect, useState } from "react";
import EditableCell from "../../../../../components/input/table/editable-cell";
import EvaluationColumn from "./evaluation-column";
import WhiteContainer from "../../../../../components/container/white-container";
import type {
  ClassworkCategory,
  GetStudentEvaluationListParams,
} from "../../types/course-type";
import { fetchStudentEvaluationList } from "../../stores/course-action";

export type DataType = {
  key: string;
  no: number;
  title: string;
  category: ClassworkCategory;
  status: string | null;
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

    const mappedData = data.evaluations.map((classwork, dataIndex) => ({
      key: classwork.activity_id.toString(),
      no: dataIndex + 1,
      title: classwork.activity_name,
      score: classwork.score,
      full_score: classwork.full_score,
      max_score: classwork.max_score,
      min_score: classwork.min_score,
      mean_score: classwork.mean_score,
      category: classwork.type,
      status: classwork.status,
      id: classwork.id,
    }));

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
