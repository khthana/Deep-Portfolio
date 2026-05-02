import { Form, message, Table, type TableProps } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useEffect, useState } from "react";
import EditableCell from "../../../../components/input/table/editable-cell";
import LearningActivityColumn from "./learning-activity-column";
import WhiteContainer from "../../../../components/container/white-container";
import {
  deleteLearningActivity,
  fetchAllLearningActivity,
} from "../stores/teacher-learning-activity-action";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";

export type DataType = {
  key: string;
  announcement_date: string;
  deadline: string;
  title: string;
  week: number;
  submitted_count: string;
  pending_count: string;
  id?: number;
  isNew?: boolean;
};

type ColumnTypes = Exclude<TableProps<DataType>["columns"], undefined>;

const LearningActivityTable = () => {
  const [form] = Form.useForm();

  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.teacherHome);

  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<DataType[]>([]);
  const [editingKey, setEditingKey] = useState("");

  const isEditing = (record: DataType) => record.key === editingKey;

  const handleFetchData = async () => {
    if (!homeSlice.selectedCourse) return;
    const result = await dispatch(
      fetchAllLearningActivity(homeSlice.selectedCourse.section_id),
    ).unwrap();

    const mappedData = result.data
      .map((classwork, dataIndex) => ({
        key: classwork.id.toString(),
        no: dataIndex + 1,
        title: classwork.learning_activity_name,
        announcement_date:
          convertDateToThaiFormat(classwork.announcement_date) ?? "-",
        deadline: convertDateToThaiFormat(classwork.deadline_date) ?? "-",
        id: classwork.id,
        submitted_count: `${classwork.submitted_count}/${classwork.student_count}`,
        pending_count: `${classwork.pending_grading_count}/${classwork.student_count}`,
        week: classwork.week_no ?? 0,
      }))
      .sort((a, b) => a.week - b.week);

    setData(mappedData);
  };

  const edit = (record: Partial<DataType> & { key: React.Key }) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  const handleDelete = async (key: React.Key) => {
    try {
      const removeData = data.find((item) => item.key === key);
      await dispatch(deleteLearningActivity(removeData?.id ?? 0)).unwrap();

      handleFetchData();

      messageApi.success("ลบเรียบร้อย");
    } catch (error) {
      messageApi.error("ไม่สามารถลบได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleCancel = () => {
    // try {
    //   const record = data.find((item) => item.key === editingKey);
    //   if (record?.isNew) {
    //     setData(data.filter((item) => item.key !== editingKey));
    //   }
    //   setEditingKey("");
    // } catch (error) {
    //   messageApi.error("ไม่สามารถยกเลิกได้ กรุณาลองใหม่อีกครั้ง");
    // }
  };

  const handleAdd = () => {
    // try {
    //   const newRow: DataType = {
    //     key: uuidv4(),
    //     week: data.length + 1,
    //     title: "",
    //     detail: "",
    //     activity: "",
    //     remark: "",
    //     isNew: true,
    //   };
    //   setData([...data, newRow]);
    //   edit(newRow);
    // } catch (error) {
    //   messageApi.error("ไม่สามารถเพิ่มข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    // }
  };

  const handleSave = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as DataType;
      const oldData = data.find((lessonPlan) => lessonPlan.key === key);
      if (!homeSlice.selectedCourse) return;

      if (!oldData?.id) {
        handleCreateNewLessonPlan(row);
      } else {
        handleUpdateLessonPlan(row, oldData.id);
      }

      handleFetchData();
      setEditingKey("");
    } catch (errInfo) {
      messageApi.error("กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleCreateNewLessonPlan = async (row: DataType) => {
    // try {
    //   if (!homeSlice.selectedCourse) return;
    //   const body: AddLessonPlanBody = {
    //     year: homeSlice.selectedCourse?.academic_year,
    //     semester: homeSlice.selectedCourse?.semester,
    //     subject_id: homeSlice.selectedCourse?.course_id,
    //     week_no: data.length,
    //     title: row.title,
    //     description: row.detail,
    //     remark: row.remark,
    //     created_by: homeSlice.selectedCourse.teacher_id,
    //     section_id: homeSlice.selectedCourse.section_id,
    //   };
    //   await dispatch(postLessonPlan(body)).unwrap();
    //   messageApi.success("เพิ่มเรียบร้อย");
    //   handleFetchData();
    // } catch (error) {
    //   messageApi.error("ไม่สามารถเพิ่มได้ กรุณาลองใหม่อีกครั้ง");
    // }
  };

  const handleUpdateLessonPlan = async (row: DataType, id: number) => {
    // try {
    //   if (!homeSlice.selectedCourse) return;
    //   const body: UpdateLessonPlanBody = {
    //     lesson_plan_id: id,
    //     title: row.title,
    //     description: row.detail,
    //     remark: row.remark,
    //   };
    //   await dispatch(editLessonPlan(body)).unwrap();
    //   messageApi.success("แก้ไขข้อมูลเรียบร้อย");
    //   handleFetchData();
    // } catch (error) {
    //   messageApi.error("ไม่สามารถแก้ไขข้อมูล กรุณาลองใหม่อีกครั้ง");
    // }
  };

  const columns = LearningActivityColumn({
    isEditing,
    edit,
    handleDelete,
    handleSave,
    handleCancel,
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
        editing: isEditing(record),
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
        กิจกรรมการเรียนรู้
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
            scroll={{ x: 1200 }}
            className="ical-align-top-table custom-table blue"
          />
        </div>
      </Form>
    </WhiteContainer>
  );
};

export default LearningActivityTable;
