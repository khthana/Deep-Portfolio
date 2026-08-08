import { Form, message, Table, type TableProps } from "antd";
import { useEffect, useState } from "react";
import EPortfolioColumn from "./e-portfolio-column";
import EditableCell from "../../../../../components/input/table/editable-cell";
import WhiteContainer from "../../../../../components/container/white-container";
import {
  MOCK_PORTFOLIO_CONFIG_1,
  MOCK_PORTFOLIO_CONFIG_2,
} from "../../data/mock-portfolio-data";
import { useNavigate } from "react-router-dom";
import { paths } from "../../../../../routes/paths.config";
import {
  getAllPortfolios,
  deletePortfolio,
} from "../../../../../services/portfolio.service";
import ShareLinkModal from "./share-link-modal";

export type DataType = {
  key: string;
  no: number;
  name: string;
  id?: string;
  isNew?: boolean;
  publicShareToken?: string | null;
  shareExpiresAt?: Date | null;
};

type ColumnTypes = Exclude<TableProps<DataType>["columns"], undefined>;

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

const EPortfolioTable = () => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<DataType[]>([]);
  const [editingKey, setEditingKey] = useState("");
  const [loading, setLoading] = useState(false);

  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    portfolioId: string;
    portfolioName: string;
    shareExpiresAt?: Date | null;
  }>({
    isOpen: false,
    portfolioId: "",
    portfolioName: "",
    shareExpiresAt: null,
  });

  const isEditing = (record: DataType) => record.key === editingKey;

  const fetchData = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      if (studentId === "") return;
      
      const res = await getAllPortfolios(studentId);
      if (res.success) {
        const formattedData: DataType[] = res.data.map((portfolio, index) => ({
          key: portfolio.id,
          no: index + 1,
          name: portfolio.portfolioName,
          id: portfolio.id,
          publicShareToken: portfolio.publicShareToken,
          shareExpiresAt: portfolio.shareExpiresAt,
        }));
        setData(formattedData);
      }
    } catch (error: any) {
      console.error("Failed to fetch portfolios:", error);
      // Only show error if it's not a 404 (Not Found) which usually means no portfolio yet
      if (error.response?.status !== 404) {
        messageApi.error("ไม่สามารถโหลดข้อมูล Portfolio ได้");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const edit = (record: Partial<DataType> & { key: React.Key }) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  const handleDelete = async (key: React.Key) => {
    try {
      const id = key.toString();

      const res = await deletePortfolio(id);
      if (res.success) {
        messageApi.success("ลบ Portfolio เรียบร้อย");
        fetchData();
      } else {
        messageApi.error(res.message || "เกิดข้อผิดพลาดในการลบ");
      }
    } catch (error) {
      console.error("Delete error:", error);
      messageApi.error("เกิดข้อผิดพลาดในการลบ");
    }
  };

  const handleCancel = () => {
    setEditingKey("");
  };

  const handleSave = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as DataType;
      const newData = [...data];
      const index = newData.findIndex((item) => item.key === key);

      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
        setData(newData);
        setEditingKey("");
        messageApi.success("บันทึกเรียบร้อย");
      } else {
        newData.push(row);
        setData(newData);
        setEditingKey("");
      }
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const handleView = (key: React.Key) => {
    const portfolio = data.find((item) => item.key === key);
    if (portfolio?.id) {
      navigate(
        paths.student.portfolio.ePortfolio.view.replace(
          ":portfolioId",
          portfolio.id.toString(),
        ),
      );
    } else {
      messageApi.error("ไม่สามารถเปิดดูได้ เนื่องจากไม่พบข้อมูล Portfolio");
    }
  };

  const handleEdit = (key: React.Key) => {
    const portfolio = data.find((item) => item.key === key);
    if (portfolio?.id) {
      navigate(
        paths.student.portfolio.ePortfolio.edit.replace(
          ":portfolioId",
          portfolio.id.toString(),
        ),
      );
    }
  };

  const handleShare = (key: React.Key) => {
    const portfolio = data.find((item) => item.key === key);
    if (portfolio?.id) {
      setShareModalData({
        isOpen: true,
        portfolioId: portfolio.id,
        portfolioName: portfolio.name,
        shareExpiresAt: portfolio.shareExpiresAt,
      });
    }
  };

  const columns = EPortfolioColumn({
    isEditing,
    edit,
    handleDelete,
    handleSave,
    handleCancel,
    handleView,
    handleEdit,
    handleShare,
    onRefresh: fetchData,
    messageApi,
  });

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
        editing: isEditing(record),
        require: col.dataIndex === "name",
      }),
    };
  });

  return (
    <WhiteContainer>
      {contextHolder}

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
            loading={loading}
          />
        </div>
      </Form>

      <ShareLinkModal
        isOpen={shareModalData.isOpen}
        onClose={() =>
          setShareModalData((prev) => ({ ...prev, isOpen: false }))
        }
        portfolioId={shareModalData.portfolioId}
        portfolioName={shareModalData.portfolioName}
        initialExpiresAt={shareModalData.shareExpiresAt}
        onRefresh={fetchData}
      />
    </WhiteContainer>
  );
};

export default EPortfolioTable;
