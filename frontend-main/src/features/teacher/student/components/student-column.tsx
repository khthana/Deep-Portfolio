import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Popconfirm } from "antd";
import type { DataType } from "./student-table";

type Props = {
  isEditing: (record: DataType) => boolean;
  edit: (record: DataType) => void;
  handleDelete: (key: React.Key) => void;
  handleSave: (key: React.Key) => void;
  handleCancel: () => void;
};

const StudentColumn = (props: Props) => [
  {
    title: "ลำดับที่",
    dataIndex: "no",
    key: "no",
    render: (text: number) => (
      <div className="caption-bold">{text ? text : "-"}</div>
    ),
    align: "center",
    width: "10%",
  },
  {
    title: "รหัสนักศึกษา",
    dataIndex: "code",
    key: "code",
    render: (text: string) => (
      <div className="text-left">{text ? text : "-"}</div>
    ),
    align: "center",
    editable: true,
    width: "20%",
  },
  {
    title: "ชื่อ - นามสกุล",
    dataIndex: "name",
    key: "name",
    render: (text: string) => (
      <div className="text-left">{text ? text : "-"}</div>
    ),
    align: "center",
    editable: true,
    width: "70%",
  },
  // {
  //   dataIndex: "operation",
  //   width: 120,
  //   render: (_: any, record: DataType) => {
  //     const editable = props.isEditing(record);

  //     return !editable ? (
  //       <div className="flex gap-4 justify-center">
  //         <img
  //           src="/assets/course/edit-icon.svg"
  //           alt="edit icon"
  //           className="cursor-pointer"
  //           onClick={() => props.edit(record)}
  //         />
  //         <Popconfirm
  //           title="ต้องการลบใช่หรือไม่"
  //           onConfirm={() => props.handleDelete(record.key)}
  //         >
  //           <img
  //             src="/assets/course/delete-icon.svg"
  //             alt="delete icon"
  //             className="cursor-pointer"
  //           />
  //         </Popconfirm>
  //       </div>
  //     ) : (
  //       <div className="flex gap-4 justify-center">
  //         <CheckOutlined onClick={() => props.handleSave(record.key)} />
  //         <CloseOutlined onClick={props.handleCancel} />
  //       </div>
  //     );
  //   },
  // },
];

export default StudentColumn;
