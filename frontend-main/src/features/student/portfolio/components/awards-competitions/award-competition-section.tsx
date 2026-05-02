import { useState, useEffect } from "react";
import { message } from "antd";
import { paths } from "../../../../../routes/paths.config";
import SectionLayout from "../section-layout";
import AwardCompetitionCard from "./award-competition-card";
import type { PortfolioAwardResp } from "../../../../../types/portfolio-award-type.type";
import {
  deletePortfolioAward,
  getAllPortfolioAward,
} from "../../../../../services/portfolio-award.service";
import AwardEditModal from "./award-edit-modal";

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

const AwardCompetitionSection = () => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const [data, setData] = useState<PortfolioAwardResp[]>([]);
  const [editingItem, setEditingItem] = useState<PortfolioAwardResp | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchAwards = async () => {
      if (!studentId) return;
      try {
        const resp = await getAllPortfolioAward(studentId);
        if (resp && resp.data) {
          setData(resp.data);
        }
      } catch (error) {
        console.error("Failed to fetch awards:", error);
      }
    };
    fetchAwards();
  }, [refreshKey, studentId]);

  const handleEdit = (id: number) => {
    const item = data.find((i) => i.id === id);
    if (item) {
      setEditingItem(item);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePortfolioAward(id);
      messageApi.success("ลบข้อมูลสำเร็จ");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      messageApi.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const handleCloseModal = () => {
    setEditingItem(null);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      {contextHolder}
      <SectionLayout
        title="รางวัลและการแข่งขัน"
        onClick={() => console.log("click")}
        href={paths.student.portfolio.awardsCompetitions.new}
      >
        {data && data.length > 0 ? (
          data.map((item) => (
            <AwardCompetitionCard
              key={item.id}
              data={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-gray-400 text-center py-4">
            ยังไม่มีข้อมูลรางวัลและการแข่งขัน กด &quot;เพิ่มข้อมูล&quot;
            เพื่อเพิ่ม
          </div>
        )}
      </SectionLayout>

      <AwardEditModal
        isOpen={!!editingItem}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        data={editingItem}
        messageApi={messageApi}
      />
    </>
  );
};

export default AwardCompetitionSection;
