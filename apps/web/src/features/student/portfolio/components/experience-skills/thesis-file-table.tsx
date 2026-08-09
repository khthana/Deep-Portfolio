import { Form, message, Table, type TableProps } from "antd";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import type { RootState } from "../../../../../stores/stores";
import EditableCell from "../../../../../components/input/table/editable-cell";
import ThesisFileColumn from "./thesis-file-column";
import { MockThesisAttachmentType } from "../../types/experience-skill-type.type";

export type DataType = {
  key: string;
  no: number;
  type: MockThesisAttachmentType;
  attachment: string;
  id?: number;
  isNew?: boolean;
};

const mockData: DataType[] = [
  {
    id: 1,
    key: "1",
    no: 1,
    attachment: "รายงานการพัฒนาโครงงาน.pdf",
    type: MockThesisAttachmentType.REPORT,
  },
  {
    id: 2,
    key: "2",
    no: 2,
    attachment: "วิดีโอสาธิต.mp4",
    type: MockThesisAttachmentType.VIDEO,
  },
  {
    id: 3,
    key: "3",
    no: 3,
    attachment: "รูปแสดงหน้าหลักของโครงงาน.jpg",
    type: MockThesisAttachmentType.IMAGE,
  },
];

type ColumnTypes = Exclude<TableProps<DataType>["columns"], undefined>;

const ThesisFileTable = () => {
  const homeSlice = useSelector((state: RootState) => state.teacherHome);

  const [messageApi, contextHolder] = message.useMessage();

  const [data] = useState<DataType[]>(mockData);
  const [editingKey, setEditingKey] = useState("");

  const isEditing = (record: DataType) => record.key === editingKey;

  const handleFetchData = async () => {
    // if (!homeSlice.selectedCourse) return;
    // const result = await dispatch(
    //   fetchLessonPlan(homeSlice.selectedCourse.section_id)
    // ).unwrap();
    // const mappedData = result.data.map((lessonPlan) => ({
    //   key: lessonPlan.id.toString(),
    //   week: lessonPlan.week_no,
    //   title: lessonPlan.title,
    //   detail: lessonPlan.description,
    //   activity: "",
    //   remark: lessonPlan.remark,
    //   id: lessonPlan.id,
    // }));
    // setData(mappedData);
  };

  const edit = (record: Partial<DataType> & { key: React.Key }) => {
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

  const handleSave = async (key: React.Key) => {
    try {
      //   const row = (await form.validateFields()) as DataType;
      //   const oldData = data.find((lessonPlan) => lessonPlan.key === key);
      //   if (!homeSlice.selectedCourse) return;
      //   if (!oldData?.id) {
      //     handleCreateNewLessonPlan(row);
      //   } else {
      //     handleUpdateLessonPlan(row, oldData.id);
      //   }
      //   handleFetchData();
      //   setEditingKey("");
    } catch {
      messageApi.error("กรุณาลองใหม่อีกครั้ง");
    }
  };

  const columns = ThesisFileColumn({
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
    <Form.Item>
      {contextHolder}
      <div>
        <Table<DataType>
          components={{
            body: { cell: EditableCell<DataType> },
          }}
          bordered
          dataSource={data}
          columns={mergedColumns as ColumnTypes}
          pagination={false}
        />
      </div>
    </Form.Item>
  );
};

export default ThesisFileTable;
