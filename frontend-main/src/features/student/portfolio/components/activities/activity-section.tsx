import { useState, useEffect } from "react";
import { message } from "antd";
import { paths } from "../../../../../routes/paths.config";
import SectionLayout from "../section-layout";
import ActivityCard from "./activity-card";
import type { PortfolioActivityType as PortfolioActivityResp } from "../../types/activity-type.type";
import {
  deletePortfolioActivity,
  getAllPortfolioActivity,
} from "../../../../../services/portfolio-activity.service";
import ActivityEditModal from "./activity-edit-modal";

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

const ActivitySection = () => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const [data, setData] = useState<PortfolioActivityResp[]>([]);
  const [editingItem, setEditingItem] = useState<PortfolioActivityResp | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchActivities = async () => {
      if (!studentId) return;
      try {
        const resp = await getAllPortfolioActivity(studentId);
        if (resp && resp.data) {
          setData(resp.data);
        }
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      }
    };
    fetchActivities();
  }, [refreshKey, studentId]);

  const handleEdit = (id: number) => {
    const item = data.find((i) => i.id === id);
    if (item) {
      setEditingItem(item);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePortfolioActivity(id);
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
        title="กิจกรรม"
        onClick={() => console.log}
        href={paths.student.portfolio.activities.new}
      >
        {data && data.length > 0 ? (
          data.map((item) => (
            <ActivityCard
              key={item.id}
              data={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-gray-400 text-center py-4">
            ยังไม่มีข้อมูลกิจกรรม กด &quot;เพิ่มข้อมูล&quot; เพื่อเพิ่ม
          </div>
        )}
      </SectionLayout>

      <ActivityEditModal
        isOpen={!!editingItem}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        data={editingItem}
        messageApi={messageApi}
      />
    </>
  );
};

export default ActivitySection;
