import { Breadcrumb } from "antd";
import PageLayout from "../../../../../components/container/page-layout";
import CreateWorkSection from "../../components/experience-skills/create-work-section";

const StudentCreateSkillPage = () => {
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

      <CreateWorkSection />
    </PageLayout>
  );
};

export default StudentCreateSkillPage;
