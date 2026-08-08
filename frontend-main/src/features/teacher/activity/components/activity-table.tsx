import { Form, message, Table, type TableProps } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useEffect, useState } from "react";
import EditableCell from "../../../../components/input/table/editable-cell";
import ActivityColumn from "./activity-column";
import type { activityType } from "../types/activity-type.type";
import {
  deleteActivity,
  fetchAllActivity,
  getValidateActivityCLOMapping,
} from "../stores/teacher-activity-action";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";
import WhiteContainer from "../../../../components/container/white-container";
import { removeActivity } from "../services/activity-service.service";

export type DataType = {
  key: string;
  no: number;
  title: string;
  announcement_date: string;
  deadline: string;
  type: activityType;
  category: string;
  submitted_count: string;
  pending_count: string;
  id?: number;
  isNew?: boolean;
};

type ColumnTypes = Exclude<TableProps<DataType>["columns"], undefined>;

const ActivityTable = () => {
  const [form] = Form.useForm();

  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.teacherHome);
  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<DataType[]>([]);

  const handleFetchData = async () => {
    if (!homeSlice.selectedCourse) return;

    const { data } = await dispatch(
      fetchAllActivity(homeSlice.selectedCourse.section_id),
    ).unwrap();

    const mappedData = data.map((classwork, dataIndex) => ({
      key: classwork.id.toString(),
      no: dataIndex + 1,
      title: classwork.activity_name,
      announcement_date:
        convertDateToThaiFormat(classwork.announcement_date) ?? "-",
      deadline: convertDateToThaiFormat(classwork.deadline_date) ?? "-",
      type: classwork.activity_type,
      category: classwork.subject_score_ratio
        ? classwork.subject_score_ratio.score_category
        : "-",
      submitted_count: `${classwork.submitted_count}/${classwork.student_count}`,
      pending_count: `${classwork.pending_grading_count}/${classwork.student_count}`,
      id: classwork.id,
    }));

    setData(mappedData);
  };

  const handleDelete = async (key: React.Key) => {
    try {
      const removeData = data.find((item) => item.key === key);
      await dispatch(deleteActivity(removeData?.id ?? 0)).unwrap();

      handleFetchData();

      messageApi.success("ลบเรียบร้อย");
    } catch (error) {
      messageApi.error("ไม่สามารถลบได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const columns = ActivityColumn({
    handleDelete,
    canDelete: true,
  });

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
  }, [homeSlice.selectedCourse]);

  return (
    <WhiteContainer>
      {contextHolder}

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
            className="ical-align-top-table custom-table blue"
            scroll={{ x: 1200 }}
          />
        </div>
      </Form>
    </WhiteContainer>
  );
};

export default ActivityTable;
