import { Form, message, Select, Table, type TableProps } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import Button from "../../../../components/button/button";
import EditableCell from "../../../../components/input/table/editable-cell";
import PersonGradebookColumn from "./person-gradebook-column";
import { fetchAllStudentInSection } from "../../student/stores/teacher-student-action";
import type {} from "../pages/teacher-gradebook-page";
import type {
  AssignmentHeaderColumnType,
  GradebookPerStudentDataType,
} from "../types/gradebook-type.type";

type ColumnTypes = Exclude<
  TableProps<GradebookPerStudentDataType>["columns"],
  undefined
>;

type Props = {
  data: GradebookPerStudentDataType[];
  assignmentHeaderColumn: AssignmentHeaderColumnType[];
};

const PersonGradebookTable = (props: Props) => {
  const [form] = Form.useForm();

  const columns = PersonGradebookColumn(props.assignmentHeaderColumn);

  const mergedColumns = columns.map((col) => {
    return {
      ...col,
      onCell: (record: GradebookPerStudentDataType) => ({
        record,
        inputType: "text",
        dataIndex: col.key as keyof GradebookPerStudentDataType,
        title: col.title,
        require: col.key === "title" ? true : false,
      }),
    };
  });

  return (
    <Form form={form} component={false}>
      <div>
        <Table<GradebookPerStudentDataType>
          components={{
            body: { cell: EditableCell<GradebookPerStudentDataType> },
          }}
          bordered
          dataSource={props.data}
          columns={mergedColumns as ColumnTypes}
          pagination={false}
          className="ical-align-top-table custom-table blue"
          scroll={{ x: "max-content" }}
        />
      </div>
    </Form>
  );
};

export default PersonGradebookTable;
