import { message, Table, type TableProps } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import EditableCell from "../../../../components/input/table/editable-cell";
import { fetchSharedRubricDetail } from "../stores/teacher-activity-action";
import Button from "../../../../components/button/button";
import type { RubricDetailForm } from "../types/rubric-type.type";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

export type DataType = {
  key: string;
  criteria_name: string;
  level_4: string;
  level_3: string;
  level_2: string;
  level_1: string;
};

type ColumnTypes = Exclude<TableProps<DataType>["columns"], undefined>;

type Props = {
  selectedKey: number;
  onBack: () => void;
  setOpenRubricModal: Dispatch<SetStateAction<boolean>>;
  setSharedRubricData: Dispatch<SetStateAction<RubricDetailForm[]>>;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (newKeys: React.Key[]) => void;
  onDeleteRubricFromForm?: (rubricTitleKey: string, detailKey: string) => void;
};

const SharedRubricDetailTable = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.teacherHome);

  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<DataType[]>([]);

  const handleFetchData = async () => {
    try {
      if (!homeSlice.selectedCourse) return;

      const { data } = await dispatch(
        fetchSharedRubricDetail(props.selectedKey),
      ).unwrap();

      const mappedData = data.map((rubric) => ({
        key: rubric.id.toString(),
        no: rubric.display_order,
        criteria_name: rubric.criteria_name_th,
        level_4: rubric.level_4_description ?? "",
        level_3: rubric.level_3_description ?? "",
        level_2: rubric.level_2_description ?? "",
        level_1: rubric.level_1_description ?? "",
      }));

      setData(mappedData);
    } catch (error) {}
  };

  const columns = [
    {
      title: "เกณฑ์การประเมิน",
      dataIndex: "criteria_name",
      key: "criteria_name",
      render: (text: string) => (
        <div className="text-left">{text ? text : "-"}</div>
      ),
      align: "center",
      editable: true,
    },
    {
      title: "4 - ดีเยี่ยม",
      dataIndex: "level_4",
      key: "level_4",
      render: (text: string) => (
        <div className="text-left">{text ? text : "-"}</div>
      ),
      align: "center",
      editable: true,
    },
    {
      title: "3 - ดีเยี่ยม",
      dataIndex: "level_3",
      key: "level_3",
      render: (text: string) => (
        <div className="text-left">{text ? text : "-"}</div>
      ),
      align: "center",
      editable: true,
    },
    {
      title: "2 - ดีเยี่ยม",
      dataIndex: "level_2",
      key: "level_2",
      render: (text: string) => (
        <div className="text-left">{text ? text : "-"}</div>
      ),
      align: "center",
      editable: true,
    },
    {
      title: "1 - ดีเยี่ยม",
      dataIndex: "level_1",
      key: "level_1",
      render: (text: string) => (
        <div className="text-left">{text ? text : "-"}</div>
      ),
      align: "center",
      editable: true,
    },
  ];

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

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    // ตรวจสอบว่ามี checkbox ถูก uncheck
    const uncheckedKeys = props.selectedRowKeys.filter(
      (key) => !newSelectedRowKeys.includes(key),
    );

    // ถ้ามี uncheck ให้ลบออกจาก form
    if (uncheckedKeys.length > 0 && props.onDeleteRubricFromForm) {
      uncheckedKeys.forEach((key) => {
        props.onDeleteRubricFromForm?.(
          props.selectedKey.toString(),
          key as string,
        );
      });
    }

    props.setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<DataType> = {
    selectedRowKeys: props.selectedRowKeys,
    onChange: onSelectChange,
  };

  const handleOnSubmit = () => {
    const selectedRubrics = data
      .filter((item) => props.selectedRowKeys.includes(item.key))
      .map<RubricDetailForm>((item) => ({
        criteria: item.criteria_name,
        weight: 0,
        levels: [
          { level_no: 4, description: item.level_4 },
          { level_no: 3, description: item.level_3 },
          { level_no: 2, description: item.level_2 },
          { level_no: 1, description: item.level_1 },
        ],
        _shared_rubric_title_key: props.selectedKey.toString(),
        _shared_rubric_detail_key: item.key,
      }));

    // Dedupe: เฉพาะ rubric ที่ยังไม่เคยถูกเพิ่มมา
    props.setSharedRubricData((prevData) => {
      const existingDetailKeys = prevData
        .map((r) => r._shared_rubric_detail_key)
        .filter((k) => k !== undefined);

      const newRubrics = selectedRubrics.filter(
        (r) => !existingDetailKeys.includes(r._shared_rubric_detail_key ?? ""),
      );

      return [...prevData, ...newRubrics];
    });

    props.setOpenRubricModal(false);
  };

  useEffect(() => {
    handleFetchData();
  }, [homeSlice.selectedCourse, props.selectedKey]);

  return (
    <div>
      <Table<DataType>
        components={{
          body: { cell: EditableCell<DataType> },
        }}
        bordered
        dataSource={data}
        columns={mergedColumns as ColumnTypes}
        pagination={false}
        className="ical-align-top-table custom-table blue cursor-pointer"
        rowSelection={rowSelection}
      />

      <div className="text-end mt-4">
        <Button onClick={handleOnSubmit}>เพิ่มเกณฑ์</Button>
      </div>
    </div>
  );
};

export default SharedRubricDetailTable;
