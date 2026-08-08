import { useEffect, useState } from "react";
import { message } from "antd";
import { paths } from "../../../../../routes/paths.config";
import SectionLayout from "../section-layout";
import ExperienceCard from "./experience-card";
import {
  getAllPortfolioInternship,
  deletePortfolioInternship,
} from "../../../../../services/portfolio-internship.service";
import type { PortfolioInternshipResp } from "../../../../../types/portfolio-internship-type.type";
import InternshipEditModal from "./internship-edit-modal";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

const ExperienceSection = () => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const [data, setData] = useState<PortfolioInternshipResp[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] =
    useState<PortfolioInternshipResp | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchData = async () => {
    if (!studentId) return;
    try {
      const res = await getAllPortfolioInternship(studentId);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching internship:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const handleDelete = async (id: number) => {
    try {
      await deletePortfolioInternship(id);
      messageApi.success("ลบข้อมูลสำเร็จ");
      fetchData();
    } catch (error) {
      console.error("Error deleting internship:", error);
      messageApi.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const handleEdit = (id: number) => {
    const internship = data.find((item) => item.id === id);
    if (internship) {
      setSelectedInternship(internship);
      setEditModalOpen(true);
    }
  };

  const handleEditSuccess = () => {
    fetchData();
  };

  return (
    <>
      {contextHolder}
      <SectionLayout
        title="การฝึกงาน/สหกิจศึกษา"
        onClick={() => {}}
        href={paths.student.portfolio.experienceSkills.newExperience}
      >
        {data.length > 0 ? (
          <div className="flex flex-col gap-4">
            {data.map((item) => (
              <ExperienceCard
                key={item.id}
                data={item}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-4">
            ยังไม่มีข้อมูลการฝึกงาน/สหกิจศึกษา กด &quot;เพิ่มข้อมูล&quot;
            เพื่อเพิ่ม
          </div>
        )}
      </SectionLayout>

      <InternshipEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        data={selectedInternship}
        messageApi={messageApi}
      />
    </>
  );
};

export default ExperienceSection;
