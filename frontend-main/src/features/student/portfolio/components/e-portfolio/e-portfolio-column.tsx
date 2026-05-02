import { Popconfirm, Tooltip } from "antd";
import { CheckOutlined, CloseOutlined, CopyOutlined, ExportOutlined } from "@ant-design/icons";
import type { DataType } from "./e-portfolio-table";

type Props = {
  isEditing: (record: DataType) => boolean;
  edit: (record: DataType) => void;
  handleDelete: (key: React.Key) => void;
  handleSave: (key: React.Key) => void;
  handleCancel: () => void;
  handleView: (key: React.Key) => void;
  handleEdit: (key: React.Key) => void;
  handleShare: (key: React.Key) => void;
  onRefresh: () => void;
  messageApi: any;
};

const EPortfolioColumn = (props: Props) => [
  {
    title: "ลำดับที่",
    dataIndex: "no",
    key: "no",
    render: (text: any) => <div className="caption-bold flex items-center justify-center">{text}</div>,
    align: "center",
    width: 100,
  },
  {
    title: "ชื่อ",
    dataIndex: "name",
    key: "name",
    render: (text: any) => <div className="text-left font-medium flex items-center">{text}</div>,
    align: "center",
    editable: true,
    width: 200,
  },
  {
    title: "ลิงก์แชร์",
    dataIndex: "publicShareToken",
    key: "shareLink",
    width: 150,
    align: "center",
    render: (token: string | null, record: DataType) => {
      const shareUrl = token ? `${window.location.origin}/p/${token}` : null;
      return (
        <div className="flex items-center gap-1 justify-center">
          {token && shareUrl ? (
            <>
              <Tooltip title={shareUrl}>
                <div className="text-[11px] text-gray-500 truncate max-w-[150px] font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                  {shareUrl}
                </div>
              </Tooltip>
              <Tooltip title="คัดลอกลิงก์">
                <CopyOutlined
                  className="cursor-pointer text-primary-orange hover:scale-110 transition-transform"
                  style={{ fontSize: "16px" }}
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    props.messageApi.success("คัดลอกลิงก์เรียบร้อยแล้ว");
                  }}
                />
              </Tooltip>
            </>
          ) : (
            <span className="text-gray-400 italic">ยังไม่มีการแชร์</span>
          )}
          <Tooltip title="จัดการลิงก์แชร์">
            <img
              src="/assets/course/edit-icon.svg"
              alt="edit icon"
              className="cursor-pointer"
              onClick={() => props.handleShare(record.key)}
            />
          </Tooltip>
          {token && shareUrl && (
            <Tooltip title="เข้าชมลิงก์แชร์">
              <ExportOutlined
                className="cursor-pointer text-blue-500 hover:scale-110 transition-transform ml-1"
                style={{ fontSize: "16px" }}
                onClick={() => window.open(shareUrl, "_blank")}
              />
            </Tooltip>
          )}
        </div>
      );
    },
  },
  {
    title: "วันหมดอายุ",
    dataIndex: "shareExpiresAt",
    key: "expiry",
    width: 150,
    render: (date: Date | null) => {
      if (!date) return <div className="text-gray-400 flex items-center justify-center">ไม่มีวันหมดอายุ</div>;
      const expiryDate = new Date(date);
      const isExpired = new Date() > expiryDate;
      return (
        <div
          className={`text-xs flex items-center justify-center ${isExpired ? "text-red-500 font-bold" : "text-gray-600"}`}
        >
          {expiryDate.toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
          {isExpired && <span className="ml-1">(หมดอายุ)</span>}
        </div>
      );
    },
    align: "center",
  },
  {
    title: "จัดการ",
    dataIndex: "operation",
    width: 150,
    align: "center",
    render: (_: any, record: DataType) => {
      const editable = props.isEditing(record);

      return !editable ? (
        <div className="flex gap-2 justify-center items-center p-2">
          <img
            src="/assets/course/eye-icon.svg"
            alt="eye icon"
            className="cursor-pointer"
            onClick={() => props.handleView(record.key)}
          />

          <img
            src="/assets/course/edit-icon.svg"
            alt="edit icon"
            className="cursor-pointer"
            onClick={() => props.handleEdit(record.key)}
          />

          <Popconfirm
            title="ต้องการลบใช่หรือไม่"
            onConfirm={() => props.handleDelete(record.key)}
          >
            <img
              src="/assets/course/delete-icon.svg"
              alt="delete icon"
              className="cursor-pointer"
            />
          </Popconfirm>
        </div>
      ) : (
        <div className="flex gap-4 justify-center items-center">
          <CheckOutlined onClick={() => props.handleSave(record.key)} />
          <CloseOutlined onClick={props.handleCancel} />
        </div>
      );
    },
  },
];

export default EPortfolioColumn;
