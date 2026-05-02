import { Form, message, Table, type TableProps } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import Button from "../../../../components/button/button";
import EditableCell from "../../../../components/input/table/editable-cell";
import StudentColumn from "./student-column";
import { fetchAllStudentInSection } from "../stores/teacher-student-action";

export type DataType = {
  key: string;
  no: number;
  code: string;
  name: string;
  id?: string;
  isNew?: boolean;
};

export const mockData: DataType[] = [
  { key: "1", no: 1, code: "65010134", name: "นายธัชพัฒน์ สรีสุวรรณ" },
  { key: "2", no: 2, code: "65010373", name: "นายทักษ์อภัย ดีเลิศ" },
  { key: "3", no: 3, code: "65010549", name: "นางสาวศรดา อารมย์ภักดีวิชัย" },
  { key: "4", no: 4, code: "65010680", name: "นางสาวปรานพรรษา ธรรมรงวนานันท์" },
  { key: "5", no: 5, code: "65010677", name: "นางสาวพลกฤต กอไพบูลย์กิจ" },
  { key: "6", no: 6, code: "65010700", name: "นางสาวมัณฑน์ธิดา นิปวี" },
  { key: "7", no: 7, code: "65010727", name: "นางสาวพิพัฒนันท์ เสือแผลง" },
  { key: "8", no: 8, code: "65010731", name: "นายพิพัฒกร ทองนุ่น" },
  { key: "9", no: 9, code: "65010800", name: "นายคณพัฒน์ แซ่สี" },
  { key: "10", no: 10, code: "65010946", name: "นายอารีโฉติ บัณฑิตพงศ์พันธุ์" },
  { key: "11", no: 11, code: "65010973", name: "นายชัยวัฒ จริยจิรัล" },
  { key: "12", no: 12, code: "65011003", name: "นายวิศวศิล พัฒนพันธ์" },
  { key: "13", no: 13, code: "65011111", name: "นายสิรัญญู เสริมสิริสัมพันธ์" },
  { key: "14", no: 14, code: "65011207", name: "นายอธิปวิชย์ ชาติละออง" },
];

type ColumnTypes = Exclude<TableProps<DataType>["columns"], undefined>;

const StudentTable = () => {
  const [form] = Form.useForm();

  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.teacherHome);

  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<DataType[]>([]);
  const [editingKey, setEditingKey] = useState("");

  const isEditing = (record: DataType) => record.key === editingKey;

  const handleFetchData = async () => {
    if (!homeSlice.selectedCourse) return;

    const { data } = await dispatch(
      fetchAllStudentInSection(homeSlice.selectedCourse.section_id),
    ).unwrap();

    const mappedData = data.map((student, dataIndex) => ({
      key: student.student_id?.toString() ?? "",
      no: dataIndex + 1,
      name: student.full_name_th ? student.full_name_th : "",
      code: student.student_id ?? "",
      id: student.student_id,
    }));

    setData(mappedData);
  };

  const edit = (record: Partial<DataType> & { key: React.Key }) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  const handleDelete = async (key: React.Key) => {
    // try {
    //   const removeData = data.find((item) => item.key === key);
    //   await dispatch(removeLessonPlan(removeData?.id ?? 0)).unwrap();
    //   handleFetchData();
    //   messageApi.success("ลบเรียบร้อย");
    // } catch (error) {
    //   messageApi.error("ไม่สามารถลบได้ กรุณาลองใหม่อีกครั้ง");
    // }
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

      // if (!oldData?.id) {
      //   handleCreateNewLessonPlan(row);
      // } else {
      //   handleUpdateLessonPlan(row, oldData.id);
      // }

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

  const columns = StudentColumn({
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
    <div>
      {contextHolder}

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
            scroll={{ x: 1000 }}
          />
        </div>
      </Form>
    </div>
  );
};

export default StudentTable;
