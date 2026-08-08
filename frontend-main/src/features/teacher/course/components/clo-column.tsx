import { Popconfirm, Tooltip } from "antd";
import type { DataType } from "./clo-table";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

type Props = {
  isEditing: (record: DataType) => boolean;
  ploList: any[] | undefined;
  edit: (record: DataType) => void;
  handleDelete: (key: React.Key) => void;
  handleSaveCLO: (key: React.Key) => void;
  handleCancel: () => void;
};

const CLOColumn = (props: Props) => [
  {
    title: "CLO",
    dataIndex: "clo",
    key: "clo",
    render: (text: any) => <div className="caption-bold">CLO-{text}</div>,
    align: "center",
    width: "10%",
  },
  {
    title: "ผลการเรียนรู้",
    dataIndex: "desc",
    key: "desc",
    render: (text: string) => (
      <div className="text-left">{text ? text : "-"}</div>
    ),
    align: "center",
    editable: true,
    width: "60%",
  },
  {
    title: "PLO",
    dataIndex: "plo",
    key: "plo",
    render: (value: number, record: DataType) => {
      const editable = props.isEditing(record);

      if (!editable && props.ploList) {
        const plo = props.ploList.find((plo) => plo.outcome_id === value);

        return (
          <div className="flex justify-between px-6">
            <div className="caption-bold">{plo?.outcome_code || "-"}</div>
            <div className="flex gap-4">
              <Tooltip
                title={`${plo?.outcome_title} : ${plo?.outcome_description}`}
              >
                <img src="/assets/course/eye-icon.svg" alt="eye icon" />
              </Tooltip>
              {/* <img
                src="/assets/course/assignment-icon.svg"
                alt="assignment icon"
              /> */}
            </div>
          </div>
        );
      }
      return null;
    },
    align: "center",
    width: "20%",
    editable: true,
  },
  {
    dataIndex: "operation",
    width: "10%",
    render: (_: any, record: DataType) => {
      const editable = props.isEditing(record);

      return !editable ? (
        <div className="flex gap-2 2xl:gap-4 justify-center">
          <img
            src="/assets/course/edit-icon.svg"
            alt="edit icon"
            className="cursor-pointer"
            onClick={() => props.edit(record)}
          />
          <Popconfirm
            title="ต้องการลบใช่หรือไม่"
            onConfirm={() => props.handleDelete(record.key)}
          >
            <img
              src="/assets/course/delete-icon.svg"
              alt="delete icon "
              className="cursor-pointer"
            />
          </Popconfirm>
        </div>
      ) : (
        <div className="flex gap-2 2xl:gap-4 justify-center">
          <CheckOutlined onClick={() => props.handleSaveCLO(record.key)} />
          <CloseOutlined onClick={props.handleCancel} />
        </div>
      );
    },
  },
];

export default CLOColumn;
