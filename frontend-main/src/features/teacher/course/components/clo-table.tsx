import React, { useEffect, useState } from "react";
import type { TableProps } from "antd";
import { Form, message, Table } from "antd";
import Button from "../../../../components/button/button";
import { v4 as uuidv4 } from "uuid";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import {
  editCLO,
  fetchCLO,
  fetchPLO,
  postCLO,
  removeCLO,
} from "../stores/teacher-course-action";
import EditableCell from "../../../../components/input/table/editable-cell";
import type { AddCLOBody, UpdateCLOBody } from "../types/clo-type.type";
import CLOColumn from "./clo-column";
import WhiteContainer from "../../../../components/container/white-container";
import type { PLOResp } from "../../../../types/course-type.type";

export type DataType = {
  key: string;
  id?: number;
  clo: number;
  desc: string;
  plo: number;
  isNew?: boolean;
};

type ColumnTypes = Exclude<TableProps<DataType>["columns"], undefined>;

const CLOTable = () => {
  const [form] = Form.useForm();

  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.teacherHome);

  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<DataType[]>([]);
  const [options, setOptions] = useState<{ value: number; label: string }[]>();
  const [ploList, setPLOList] = useState<PLOResp[]>();
  const [editingKey, setEditingKey] = useState("");

  const isEditing = (record: DataType) => record.key === editingKey;

  const handleFetchData = async () => {
    if (!homeSlice.selectedCourse) return;

    const result = await dispatch(
      fetchCLO(homeSlice.selectedCourse.section_id),
    ).unwrap();

    const mappedData = result.data.map((clo) => ({
      key: clo.clo_id.toString(),
      clo: parseInt(clo.clo_number),
      desc: clo.clo_detail,
      plo: clo.plo_id,
      id: clo.clo_id,
    }));

    setData(mappedData);
  };

  const handleFetchPLOOptions = async () => {
    try {
      if (!homeSlice.selectedCourse) return;

      const { data } = await dispatch(
        fetchPLO(homeSlice.selectedCourse.program_id),
      ).unwrap();

      const ploOptions = data.map((plo) => {
        return {
          value: plo.outcome_id,
          label: `${plo.outcome_code} ${plo.outcome_title}`,
        };
      });
      setOptions(ploOptions);
      setPLOList(data);
    } catch (error) {}
  };

  const edit = (record: Partial<DataType> & { key: React.Key }) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  const handleDelete = async (key: React.Key) => {
    try {
      const removeData = data.find((item) => item.key === key);
      await dispatch(removeCLO(removeData?.id ?? 0)).unwrap();

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
        clo: data.length + 1,
        desc: "",
        plo: 0,
        isNew: true,
      };

      setData([...data, newRow]);

      edit(newRow);
    } catch (error) {
      messageApi.error("ไม่สามารถเพิ่มข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleSaveCLO = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as DataType;
      const oldData = data.find((clo) => clo.key === key);
      if (!homeSlice.selectedCourse) return;

      if (!oldData?.id) {
        handleCreateNewCLO(row);
      } else {
        handleUpdateCLO(row, oldData.id);
      }

      handleFetchData();
      setEditingKey("");
    } catch (errInfo) {
      messageApi.error("กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleCreateNewCLO = async (row: DataType) => {
    try {
      if (!homeSlice.selectedCourse) return;
      const body: AddCLOBody = {
        year: homeSlice.selectedCourse?.academic_year,
        semester: homeSlice.selectedCourse?.semester,
        subject_id: homeSlice.selectedCourse?.course_id,
        clo_number: JSON.stringify(data.length),
        clo_detail: row.desc,
        plo_id: row.plo,
        created_by: homeSlice.selectedCourse.teacher_id,
        section_id: homeSlice.selectedCourse.section_id,
        section_number: homeSlice.selectedCourse.section_number,
      };
      await dispatch(postCLO(body)).unwrap();

      messageApi.success("เพิ่มเรียบร้อย");
      handleFetchData();
    } catch (error) {
      messageApi.error("ไม่สามารถเพิ่มได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleUpdateCLO = async (row: DataType, id: number) => {
    try {
      if (!homeSlice.selectedCourse) return;

      const body: UpdateCLOBody = {
        id: id,
        clo_detail: row.desc,
        plo_id: row.plo,
      };

      await dispatch(editCLO(body)).unwrap();

      messageApi.success("แก้ไขข้อมูลเรียบร้อย");

      handleFetchData();
    } catch (error) {
      messageApi.error("ไม่สามารถแก้ไขข้อมูล กรุณาลองใหม่อีกครั้ง");
    }
  };

  const columns = CLOColumn({
    isEditing,
    ploList,
    edit,
    handleDelete,
    handleSaveCLO,
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
        inputType:
          col.dataIndex === "clo"
            ? "number"
            : col.dataIndex === "plo"
              ? "select"
              : "text",
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        options: col.dataIndex === "plo" && options ? options : undefined,
        require: true,
      }),
    };
  });

  useEffect(() => {
    handleFetchData();
    handleFetchPLOOptions();
  }, [homeSlice.selectedCourse]);

  return (
    <WhiteContainer>
      {contextHolder}

      <div className="body-bold-1 pb-5 border-b border-light-grey">
        ผลการเรียนรู้ระดับรายวิชา
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
            scroll={{ x: 800 }}
            tableLayout="fixed"
          />
        </div>

        <div className="self-end">
          <Button
            iconSrc="/assets/announcement/add-icon.svg"
            className="rounded-4xl py-4"
            onClick={handleAdd}
          >
            เพิ่ม CLO
          </Button>
        </div>
      </Form>
    </WhiteContainer>
  );
};

export default CLOTable;
