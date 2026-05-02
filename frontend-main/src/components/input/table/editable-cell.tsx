import React from "react";
import { Form, Input, InputNumber, Select } from "antd";

export interface EditableCellProps<
  T,
> extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: keyof T;
  key: string;
  title: any;
  inputType: "number" | "text" | "select";
  record: T;
  index: number;
  options?: any;
  require?: boolean;
}

const EditableCell = <T extends Record<string, any>>({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  options,
  require = false,
  ...restProps
}: React.PropsWithChildren<EditableCellProps<T>>) => {
  const inputNode =
    inputType === "number" ? (
      <InputNumber style={{ width: "100%", minWidth: 80 }} />
    ) : inputType === "text" ? (
      <Input style={{ width: "100%", minWidth: 100 }} />
    ) : (
      <Select
        options={options}
        style={{ width: "100%", minWidth: 100, maxWidth: "100%" }}
        
      />
    );

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex as string}
          style={{ margin: 0, width: "100%" }}
          rules={[
            {
              required: require,
              message: `กรุณากรอก${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

export default EditableCell;
