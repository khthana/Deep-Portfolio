import { Breadcrumb } from "antd";
import CreateExperienceSection from "../../components/experience-skills/create-experience-section";
import PageLayout from "../../../../../components/container/page-layout";

const StudentCreateExperiencePage = () => {
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

      <CreateExperienceSection />
    </PageLayout>
  );
};

export default StudentCreateExperiencePage;
