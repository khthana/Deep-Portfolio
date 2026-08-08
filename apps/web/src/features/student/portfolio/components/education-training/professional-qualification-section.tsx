import { paths } from "../../../../../routes/paths.config";
import type { MockProfessionalQualificationType } from "../../types/education-section-type.type";
import SectionLayout from "../section-layout";
import ProfessionalQualificationCard from "./professional-qualification-card";

const mockData: MockProfessionalQualificationType[] = [
  {
    year: 2568,
    name: "Cisco Certified Network Associate (CCNA)",
    organizer: "Cisco Networking Academy",
    description: "ออนไลน์",
  },
];

const ProfessionalQualificationSection = () => {
  return (
    <SectionLayout
      title="คุณวุฒิทางวิชาชีพ"
      onClick={() => console.log("click")}
      href={
        paths.student.portfolio.educationTraining.newProfessionalQualification
      }
    >
      {mockData.length > 0 ? (
        mockData.map((data, index) => (
          <ProfessionalQualificationCard key={index} data={data} />
        ))
      ) : (
        <div className="text-gray-400 text-center py-4">
          ยังไม่มีข้อมูลคุณวุฒิทางวิชาชีพ กด &quot;เพิ่มข้อมูล&quot; เพื่อเพิ่ม
        </div>
      )}
    </SectionLayout>
  );
};

export default ProfessionalQualificationSection;
