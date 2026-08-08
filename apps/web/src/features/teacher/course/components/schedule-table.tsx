import { Table, type TableProps } from "antd";
import WhiteContainer from "../../../../components/container/white-container";

type DataType = {
  key: string;
  day_of_week: string;
  time: string;
  type: string;
  room: string;
};

const columns: TableProps<DataType>["columns"] = [
  {
    title: "วัน",
    dataIndex: "day_of_week",
    key: "day_of_week",
    render: (text) => <div className="caption-bold">{text}</div>,
    align: "center",
  },
  {
    title: "เวลา",
    dataIndex: "time",
    key: "time",
    render: (text) => <div className="text-left">{text}</div>,
    align: "center",
  },
  {
    title: "ทฤษฎี/ปฏิบัติ",
    dataIndex: "type",
    key: "type",
    render: (text) => <div className="text-left">{text}</div>,
    align: "center",
  },
  {
    title: "ห้องเรียน",
    dataIndex: "room",
    key: "room",
    render: (text) => <div className="text-left">{text}</div>,
    align: "center",
  },
];

const data: DataType[] = [
  {
    key: "1",
    day_of_week: "จันทร์",
    time: "09:30 - 11:30 (2 ชั่วโมง)",
    room: "ECC-802",
    type: "ทฤษฎ๊",
  },
  {
    key: "2",
    day_of_week: "จันทร์",
    time: "13:30 - 15:30 (2 ชั่วโมง)",
    room: "ECC-802",
    type: "ปฏิบัติ",
  },
];

const ScheduleTable = () => {
  return (
    <WhiteContainer>
      <div className="body-bold-1 pb-8 border-b border-light-grey">
        กำหนดการสอน
      </div>

      <Table<DataType>
        columns={columns}
        dataSource={data}
        bordered
        rowHoverable={false}
        pagination={false}
        className="ical-align-top-table custom-table blue"
      />
    </WhiteContainer>
  );
};

export default ScheduleTable;
