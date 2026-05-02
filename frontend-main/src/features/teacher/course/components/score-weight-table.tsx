import React, { useEffect, useState } from "react";
import type { TableProps } from "antd";
import { Form, message, Table } from "antd";
import Button from "../../../../components/button/button";
import type {
  AddScoreWeightBody,
  GetScoreWeightParams,
  UpdateScoreWeightBody,
} from "../types/score-weight-type.type";
import { v4 as uuidv4 } from "uuid";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import {
  editScoreWeight,
  fetchScoreWeight,
  postScoreWeight,
  removeScoreWeight,
} from "../stores/teacher-course-action";
import EditableCell from "../../../../components/input/table/editable-cell";
import ScoreWeightColumn from "./score-weight-column";
import WhiteContainer from "../../../../components/container/white-container";

export type DataType = {
  key: string;
  id?: number;
  title: string;
  weight: number;
  isNew?: boolean;
};

type ColumnTypes = Exclude<TableProps<DataType>["columns"], undefined>;

const ScoreWeightTable = () => {
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
      fetchScoreWeight(homeSlice.selectedCourse.section_id),
    ).unwrap();

    const mappedData = result.data.map((score) => ({
      key: score.score_ratio_id.toString(),
      title: score.score_category,
      weight: score.weight,
      id: score.score_ratio_id,
    }));

    setData(mappedData);
  };

  const edit = (record: Partial<DataType> & { key: React.Key }) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  const handleDelete = async (key: React.Key) => {
    try {
      const removeData = data.find((item) => item.key === key);

      await dispatch(removeScoreWeight(removeData?.id ?? 0)).unwrap();

      handleFetchData();

      messageApi.success("ลบเรียบร้อย");
    } catch (error) {
      messageApi.error("ไม่สามารถลบได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleCancel = () => {
    try {
      const record = data.find((item) => item.key === editingKey);

      if (record?.isNew) {
        setData(data.filter((item) => item.key !== editingKey));
      }

      setEditingKey("");
    } catch (error) {
      messageApi.error("ไม่สามารถยกเลิกได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleAdd = () => {
    try {
      const newRow: DataType = {
        key: uuidv4(),
        title: "",
        weight: 0,
        isNew: true,
      };

      setData([...data, newRow]);
      edit(newRow);
    } catch (error) {
      messageApi.error("ไม่สามารถเพิ่มข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const validateTotalWeight = (newData: DataType[]) => {
    const total = newData.reduce((sum, item) => sum + (item.weight || 0), 0);
    if (total !== 100) {
      return `คะแนนรวมตอนนี้ ${total}% (ต้องเป็น 100%)`;
    }
    return null;
  };

  const handleSaveScoreWeight = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as DataType;
      const oldData = data.find((score) => score.key === key);

      if (!homeSlice.selectedCourse) return;

      if (!oldData?.id) {
        handleAddScoreWeight(row);
      } else {
        handleUpdateScoreWeight(row, oldData.id);
      }

      setEditingKey("");
    } catch (errInfo) {
      messageApi.error("กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleAddScoreWeight = async (row: DataType) => {
    try {
      if (!homeSlice.selectedCourse) return;

      const body: AddScoreWeightBody = {
        // year: homeSlice.selectedCourse.academic_year,
        // semester: homeSlice.selectedCourse.semester,
        // subject_id: homeSlice.selectedCourse.course_id,
        score_category: row.title,
        weight: row.weight,
        sequence_order: 1,
        created_by: homeSlice.selectedCourse.teacher_id,
        section_id: homeSlice.selectedCourse.section_id,
        // section_number: homeSlice.selectedCourse.section_number,
      };
      await dispatch(postScoreWeight(body)).unwrap();

      messageApi.success("เพิ่มเรียบร้อย");

      handleFetchData();
    } catch (error) {
      messageApi.error("ไม่สามารถเพิ่มได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleUpdateScoreWeight = async (row: DataType, id?: number) => {
    try {
      if (!homeSlice.selectedCourse) return;

      const body: UpdateScoreWeightBody = {
        score_id: id ?? 0,
        score_category: row.title,
        weight: row.weight,
      };

      await dispatch(editScoreWeight(body)).unwrap();

      messageApi.success("แก้ไขข้อมูลเรียบร้อย");

      handleFetchData();
    } catch (error) {
      messageApi.error("ไม่สามารถแก้ไขข้อมูล กรุณาลองใหม่อีกครั้ง");
    }
  };

  const columns = ScoreWeightColumn({
    isEditing,
    edit,
    handleDelete,
    handleSaveScoreWeight,
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
        inputType: col.dataIndex === "weight" ? "number" : "text",
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        require: true,
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
        สัดส่วนคะแนน
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
            scroll={{ x: 600 }}
          />

          <div className="text-red-600 text-end mt-2 caption-regular">
            {validateTotalWeight(data)}
          </div>
        </div>

        <div className="self-end">
          <Button
            iconSrc="/assets/announcement/add-icon.svg"
            className="rounded-4xl py-4"
            onClick={handleAdd}
          >
            เพิ่มเกณฑ์คะแนน
          </Button>
        </div>
      </Form>
    </WhiteContainer>
  );
};

export default ScoreWeightTable;
