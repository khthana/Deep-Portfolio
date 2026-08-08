import { Form, message, Table, type TableProps } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import EditableCell from "../../../../components/input/table/editable-cell";
import { fetchSharedRubric } from "../stores/teacher-activity-action";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

export type DataType = {
  key: string;
  code: string;
  rubric_name: string;
};

type ColumnTypes = Exclude<TableProps<DataType>["columns"], undefined>;

type Props = {
  handleSelectedKey: (key: string) => void;
};

const SharedRubricTitleTable = (props: Props) => {
  const [form] = Form.useForm();

  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.teacherHome);

  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<DataType[]>([]);

  const handleFetchData = async () => {
    try {
      if (!homeSlice.selectedCourse) return;

      const { data } = await dispatch(
        fetchSharedRubric(homeSlice.selectedCourse?.program_id),
      ).unwrap();

      const mappedData = data.map((rubric) => ({
        key: rubric.id.toString(),
        code: rubric.rubric_code,
        rubric_name: rubric.rubric_name_th,
      }));

      setData(mappedData);
    } catch (error) {}
  };

  const columns = [
    {
      title: "รหัส",
      dataIndex: "code",
      key: "code",
      render: (text: string) => <div>{text ? text : "-"}</div>,
      align: "center",
      editable: true,
      width: 130,
    },
    {
      title: "ชื่อเกณฑ์การประเมิน",
      dataIndex: "rubric_name",
      key: "rubric_name",
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

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<DataType> = {
    type: "radio",
    selectedRowKeys,
    onChange: onSelectChange,
  };

  useEffect(() => {
    handleFetchData();
  }, [homeSlice.selectedCourse]);

  return (
    // <div className="bg-white w-full p-8 rounded-2xl flex flex-col gap-8">
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
        //   rowSelection={rowSelection}Qs
        onRow={(record) => ({
          onClick: () => props.handleSelectedKey(record.key),
        })}
      />
      {/* </div> */}
    </div>
  );
};

export default SharedRubricTitleTable;
