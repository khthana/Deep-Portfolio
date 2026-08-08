import { Breadcrumb } from "antd";
import PageLayout from "../../../../../components/container/page-layout";
import AddSkillWorkSection from "../../components/experience-skills/add-skill-work-section";

const StudentAddSkillWorkPage = () => {
  return (
    <PageLayout>
      <Breadcrumb
        className="breadcrumb-bold"
        separator=">"
        items={[
          { title: "แฟ้มผลงาน" },
          { title: "ประสบการณ์และทักษะ" },
          { title: "เพิ่มผลงาน" },
        ]}
      />

      <AddSkillWorkSection />
    </PageLayout>
  );
};

export default StudentAddSkillWorkPage;
