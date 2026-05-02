import { useState } from "react";
import { message } from "antd";
import { paths } from "../../../../../routes/paths.config";
import SectionLayout from "../section-layout";
import TrainingCard from "./training-card";
import type { PortfolioTrainingResp } from "../../../../../types/portfolio-training-type.type";
import { deletePortfolioTraining } from "../../../../../services/portfolio-training.service";
import TrainingEditModal from "./training-edit-modal";

type TrainingSectionProps = {
  data?: PortfolioTrainingResp[];
  onRefresh?: () => void;
};

const TrainingSection = ({ data, onRefresh }: TrainingSectionProps) => {
  const [editingItem, setEditingItem] = useState<PortfolioTrainingResp | null>(
    null,
  );
  const [messageApi, contextHolder] = message.useMessage();

  const handleEdit = (id: number) => {
    const item = data?.find((i) => i.id === id);
    if (item) {
      setEditingItem(item);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePortfolioTraining(id);
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
        title="การฝึกอบรม"
        onClick={() => console.log("click")}
        href={paths.student.portfolio.educationTraining.newTraining}
      >
        {data && data.length > 0 ? (
          data.map((item) => (
            <TrainingCard
              key={item.id}
              data={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-gray-400 text-center py-4">
            ยังไม่มีข้อมูลการฝึกอบรม กด &quot;เพิ่มข้อมูล&quot; เพื่อเพิ่ม
          </div>
        )}
      </SectionLayout>

      <TrainingEditModal
        isOpen={!!editingItem}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        data={editingItem}
        messageApi={messageApi}
      />
    </>
  );
};

export default TrainingSection;
