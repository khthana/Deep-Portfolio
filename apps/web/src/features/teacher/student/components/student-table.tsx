import { Form, message, Table, type TableProps } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useEffect, useState } from "react";
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

  const handleSave = async () => {
    try {
      // Called for the throw: an invalid row must not go on to be saved.
      await form.validateFields();
      if (!homeSlice.selectedCourse) return;

      handleFetchData();
      setEditingKey("");
    } catch {
      messageApi.error("กรุณาลองใหม่อีกครั้ง");
    }
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
