import { Form, Table, type TableProps } from "antd";
import EditableCell from "../../../../components/input/table/editable-cell";
import AssignmentGradebookColumn from "./assignment-gradebook-column";
import type { GradebookPerActivityDataType } from "../types/gradebook-type.type";

type ColumnTypes = Exclude<
  TableProps<GradebookPerActivityDataType>["columns"],
  undefined
>;

type Props = {
  gradebookPerActivityData: GradebookPerActivityDataType[];
};

const AssignmentGradebookTable = (props: Props) => {
  const [form] = Form.useForm();

  const columns = AssignmentGradebookColumn();

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: GradebookPerActivityDataType) => ({
        record,
        inputType: "text",
        dataIndex: col.dataIndex,
        title: col.title,
        require: col.dataIndex === "title" ? true : false,
      }),
    };
  });

  return (
    <Form form={form} component={false}>
      <div>
        <Table<GradebookPerActivityDataType>
          components={{
            body: { cell: EditableCell<GradebookPerActivityDataType> },
          }}
          bordered
          dataSource={props.gradebookPerActivityData}
          columns={mergedColumns as ColumnTypes}
          pagination={false}
          scroll={{ x: 1200 }}
          className="ical-align-top-table custom-table blue"
        />
      </div>
    </Form>
  );
};

export default AssignmentGradebookTable;
