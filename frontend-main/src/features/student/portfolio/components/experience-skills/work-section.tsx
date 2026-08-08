import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import type { PortfolioWorkResp } from "../../../../../types/portfolio-skill-type.type";
import { getPortfolioWorks } from "../../../../../services/portfolio-skill.service";
import { paths } from "../../../../../routes/paths.config";
import SectionLayout from "../section-layout";
import WorkCard from "./work-card";

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

const WorkSection = () => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const [works, setWorks] = useState<PortfolioWorkResp[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorks = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await getPortfolioWorks(studentId);
      if (res.success) {
        setWorks(res.data);
      }
    } catch {
      message.error("ไม่สามารถโหลดข้อมูลผลงานได้");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  return (
    <SectionLayout
      title="ทักษะและผลงาน"
      onClick={() => {}}
      href={paths.student.portfolio.experienceSkills.newSkill}
    >
      {loading ? (
        <div className="text-gray-400 text-center py-4">กำลังโหลด...</div>
      ) : works.length === 0 ? (
        <div className="text-gray-400 text-center py-4">
          ยังไม่มีข้อมูลทักษะและผลงาน กด &quot;เพิ่มข้อมูล&quot; เพื่อเพิ่ม
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {works.map((work) => (
            <WorkCard
              key={work.student_activity_id}
              work={work}
              onSuccess={fetchWorks}
            />
          ))}
        </div>
      )}
    </SectionLayout>
  );
};

export default WorkSection;
