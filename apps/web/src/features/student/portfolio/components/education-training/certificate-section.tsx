import { useState } from "react";
import { message } from "antd";
import { paths } from "../../../../../routes/paths.config";
import SectionLayout from "../section-layout";
import type { PortfolioCertificateResp } from "../../../../../types/portfolio-certificate-type.type";
import { deletePortfolioCertificate } from "../../../../../services/portfolio-certificate.service";
import CertificateEditModal from "./certificate-edit-modal";
import CertificateCard from "./certificate-card";

type CertificateSectionProps = {
  data?: PortfolioCertificateResp[];
  onRefresh?: () => void;
};

const CertificateSection = ({ data, onRefresh }: CertificateSectionProps) => {
  const [editingItem, setEditingItem] =
    useState<PortfolioCertificateResp | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const handleEdit = (id: number) => {
    const item = data?.find((i) => i.id === id);
    if (item) {
      setEditingItem(item);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePortfolioCertificate(id);
      messageApi.success("ลบข้อมูลสำเร็จ");
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error(error);
      messageApi.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const handleCloseModal = () => {
    setEditingItem(null);
  };

  const handleSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <>
      {contextHolder}
      <SectionLayout
        title="คุณวุฒิทางวิชาชีพ"
        onClick={() => console.log("click")}
        href={paths.student.portfolio.educationTraining.newCertificate}
      >
        {data && data.length > 0 ? (
          data.map((item) => (
            <CertificateCard
              key={item.id}
              data={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-gray-400 text-center py-4">
            ยังไม่มีข้อมูลคุณวุฒิทางวิชาชีพ กด &quot;เพิ่มข้อมูล&quot;
            เพื่อเพิ่ม
          </div>
        )}
      </SectionLayout>

      <CertificateEditModal
        isOpen={!!editingItem}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        data={editingItem}
        messageApi={messageApi}
      />
    </>
  );
};

export default CertificateSection;
