import { useState } from "react";
import { paths } from "../../../../../routes/paths.config";
import SectionLayout from "../section-layout";
import EducationCard from "./education-card";
import type { PortfolioEducationResp } from "../../../../../types/portfolio-education-type.type";
import EducationEditModal from "./education-edit-modal";
import {
  educationDegreeLabel,
  type educationDegreeType,
} from "../../types/education-section-type.type";
import { deletePortfolioEducation } from "../../../../../services/portfolio-education.service";
import { message } from "antd";

type EducationSectionProps = {
  data?: PortfolioEducationResp[];
  onRefresh?: () => void;
};

const EducationSection = ({ data, onRefresh }: EducationSectionProps) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [editingItem, setEditingItem] = useState<PortfolioEducationResp | null>(
    null,
  );

  const handleEdit = (id: number) => {
    const item = data?.find((i) => i.id === id);
    if (item) {
      setEditingItem(item);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePortfolioEducation(id);
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
        title="ประวัติการศึกษา"
        onClick={() => console.log("click")}
        href={paths.student.portfolio.educationTraining.newEducation}
      >
        {data && data.length > 0 ? (
          data.map((item) => (
            <EducationCard
              key={item.id}
              data={{
                id: item.id,
                startYear: item.start_year || 0,
                endYear: item.end_year ?? 0,
                degree:
                  educationDegreeLabel[
                    item.education_level as educationDegreeType
                  ] || item.education_level,
                university: item.institution || "",
                faculty:
                  item.education_level === "HIGH_SCHOOL" ||
                  item.education_level === "มัธยมปลาย"
                    ? "แผนการเรียน " + item.study_plan || ""
                    : `${"คณะ" + item.faculty || ""} ${
                        "สาขา" + item.major || ""
                      }`.trim(),
                isShow: item.is_show ?? true, // Map is_show to isShow, default to true
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-gray-400 text-center py-4">
            ยังไม่มีข้อมูลประวัติการศึกษา กด &quot;เพิ่มข้อมูล&quot; เพื่อเพิ่ม
          </div>
        )}
      </SectionLayout>

      <EducationEditModal
        isOpen={!!editingItem}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        data={editingItem}
        messageApi={messageApi}
      />
    </>
  );
};

export default EducationSection;
