import { Form, message, Table, type TableProps } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useEffect, useState } from "react";
import EditableCell from "../../../../components/input/table/editable-cell";
import MaterialColumn from "./material-column";
import WhiteContainer from "../../../../components/container/white-container";
import {
  fetchCourseMaterial,
  postCourseMaterial,
} from "../stores/teacher-material-action";
import type { AttachmentDetailResp } from "../../../../types/attachment-type.type";
import {
  type AttachmentDetailItem,
} from "../../announcement/types/announement-type";

export type DataType = {
  key: string;
  week: number;
  title: string;
  lecture: AttachmentDetailResp;
  record: AttachmentDetailResp;
  id?: number;
  isNew?: boolean;
};

export type AttachmentItemsType = AttachmentDetailItem & {
  type: "LECTURE" | "RECORD";
};

type ColumnTypes = Exclude<TableProps<DataType>["columns"], undefined>;

const MaterialTable = () => {
  const [form] = Form.useForm<{ attachments: AttachmentItemsType[] }>();

  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.teacherHome);
  const metarialSlice = useSelector(
    (state: RootState) => state.teacherCourseMaterial,
  );

  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<DataType[]>([]);
  const [editingKey, setEditingKey] = useState("");
  // Only the setter is used here: the list itself is held by `MaterialColumn`,
  // which is handed this setter to fill in.
  const [, setAttachmentItems] = useState<AttachmentItemsType[]>([]);

  const isEditing = (record: DataType) => record.key === editingKey;

  const handleFetchData = async () => {
    if (!homeSlice.selectedCourse) return;
    const result = await dispatch(
      fetchCourseMaterial(homeSlice.selectedCourse.section_id),
    ).unwrap();

    const mappedData = result.data.map((material) => ({
      key: material.course_syllabus_id.toString(),
      week: material.week_no,
      title: material.title,
      lecture: material.course_materials.lecture,
      record: material.course_materials.record,
      id: material.course_syllabus_id,
    }));
    setData(mappedData);
  };

  const edit = (record: Partial<DataType> & { key: React.Key }) => {
    // form.setFieldsValue({ ...record });
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
    try {
      const record = data.find((item) => item.key === editingKey);

      if (record?.isNew) {
        setData(data.filter((item) => item.key !== editingKey));
      }

      form.resetFields();
      setEditingKey("");
    } catch {
      messageApi.error("ไม่สามารถยกเลิกได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleSave = async (key: React.Key) => {
    try {
      const row = await form.validateFields();
      const oldData = data.find((lessonPlan) => lessonPlan.key === key);

      if (!homeSlice.selectedCourse) return;

      const formData = new FormData();

      if (oldData?.id) {
        formData.append("course_syllabus_id", oldData.id.toString());
      }

      formData.append(
        "section_id",
        homeSlice.selectedCourse.section_id.toString(),
      );

      // 1. สร้างตัวแปรมารอรับค่า URL
      const lectureUrlList: { title: string; url: string }[] = [];
      const recordUrlList: { title: string; url: string }[] = [];

      // 2. วน Loop ครั้งเดียว จัดการทั้ง FILE และ LINK
      (row.attachments || []).forEach((item) => {
        // ----------------- LECTURE -----------------
        if (item.type === "LECTURE") {
          // กรณีเป็น FILE
          if (item.attachmentType === "FILE") {
            // ต้องเช็ค originFileObj เพราะเป็น UploadFile
            if (item.attachmentItems.originFileObj) {
              formData.append(
                "lecture_files",
                item.attachmentItems.originFileObj,
              );
            }
          }
          // กรณีเป็น LINK (เพิ่มตรงนี้)
          else if (item.attachmentType === "LINK") {
            // ✅ TypeScript รู้ทันทีว่า item.attachmentItems คือ LinkItems (มี title, url)
            lectureUrlList.push({
              title: item.attachmentItems.title,
              url: item.attachmentItems.url,
            });
          }
        }

        // ----------------- RECORD -----------------
        else if (item.type === "RECORD") {
          // กรณีเป็น FILE
          if (item.attachmentType === "FILE") {
            if (item.attachmentItems.originFileObj) {
              formData.append(
                "record_files",
                item.attachmentItems.originFileObj,
              );
            }
          } else if (item.attachmentType === "LINK") {
            recordUrlList.push({
              title: item.attachmentItems.title,
              url: item.attachmentItems.url,
            });
          }
        }
      });

      formData.append("lecture_urls", JSON.stringify(lectureUrlList));
      formData.append("record_urls", JSON.stringify(recordUrlList));

      await dispatch(postCourseMaterial(formData)).unwrap();

      messageApi.success("บันทึกข้อมูลสำเร็จ");
      handleFetchData();
      form.resetFields();
      setEditingKey("");
    } catch (errInfo) {
      console.error(errInfo);
      messageApi.error("กรุณาลองใหม่อีกครั้ง");
    }
  };

  const columns = MaterialColumn({
    isLoading:
      metarialSlice.editCourseMaterialLoading ||
      metarialSlice.postCourseMaterialLoading ||
      metarialSlice.removeCourseMaterialLoading,
    isEditing,
    edit,
    handleDelete,
    handleSave,
    handleCancel,
    handleFetchData,
    form,
    setAttachmentItems,
    messageInstance: messageApi,
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

        // require: true,
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
        สื่อการสอน
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

export default MaterialTable;
