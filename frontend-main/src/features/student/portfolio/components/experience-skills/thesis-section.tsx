import { useEffect, useState, useCallback } from "react";
// Removed useNavigate as SectionLayout handles navigation via href
// import { useNavigate } from "react-router-dom";
// Removed Button as SectionLayout includes it
import SectionLayout from "../section-layout";
import { paths } from "../../../../../routes/paths.config";
import ThesisCard from "./thesis-card";
import {
  getAllPortfolioThesis,
  deletePortfolioThesis,
} from "../../../../../services/portfolio-thesis.service";
import type { PortfolioThesisResp } from "../../types/portfolio-thesis-type.type";
import ThesisEditModal from "./thesis-edit-modal";
import { message } from "antd";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

const ThesisSection = () => {
  const { studentId } = useSelector((state: RootState) => state.home);
  // const navigate = useNavigate();
  const [thesisList, setThesisList] = useState<PortfolioThesisResp[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedThesis, setSelectedThesis] =
    useState<PortfolioThesisResp | null>(null);

  const fetchThesis = useCallback(async () => {
    if (!studentId) return;
    try {
      const res = await getAllPortfolioThesis(studentId);
      if (res.success) {
        setThesisList(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  }, [studentId]);

  useEffect(() => {
    fetchThesis();
  }, [fetchThesis]);

  const handleEdit = (id: number) => {
    const thesis = thesisList.find((item) => item.id === id);
    if (thesis) {
      setSelectedThesis(thesis);
      setIsEditModalOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deletePortfolioThesis(id);
      if (res.success) {
        message.success("ลบข้อมูลสำเร็จ");
        fetchThesis();
      } else {
        message.error("เกิดข้อผิดพลาดในการลบรายการ");
      }
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการลบรายการ");
    }
  };

  const handleModalSuccess = () => {
    fetchThesis();
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionLayout
        title="โครงงานปริญญาตรี"
        onClick={() => console.log("click")}
        href={paths.student.portfolio.experienceSkills.newThesis}
      >
        <div className="grid grid-cols-1 gap-4">
          {thesisList.length > 0 ? (
            thesisList.map((item) => (
              <ThesisCard
                key={item.id}
                data={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="text-gray-400 text-center py-4">
              ยังไม่มีข้อมูลโครงงานปริญญาตรี กด &quot;เพิ่มข้อมูล&quot;
              เพื่อเพิ่ม
            </div>
          )}
        </div>
      </SectionLayout>

      <ThesisEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleModalSuccess}
        data={selectedThesis}
      />
    </div>
  );
};

export default ThesisSection;
