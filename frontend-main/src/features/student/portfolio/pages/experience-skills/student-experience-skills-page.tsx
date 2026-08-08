import { Breadcrumb } from "antd";
import WorkSection from "../../components/experience-skills/work-section";
import ExperienceSection from "../../components/experience-skills/experience-section";
import ThesisSection from "../../components/experience-skills/thesis-section";
import PageLayout from "../../../../../components/container/page-layout";

const StudentExperienceSkillsPage = () => {
  return (
    <PageLayout>
      <Breadcrumb
        className="breadcrumb-bold"
        separator=">"
        items={[
          {
            title: "แฟ้มผลงาน",
          },
          {
            title: "ประสบการณ์และทักษะ",
          },
        ]}
      />

      <WorkSection />
      <ExperienceSection />
      <ThesisSection />
    </PageLayout>
  );
};

export default StudentExperienceSkillsPage;
