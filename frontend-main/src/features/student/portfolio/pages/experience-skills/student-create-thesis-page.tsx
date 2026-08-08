import { Breadcrumb } from "antd";
import CreateThesisSection from "../../components/experience-skills/create-thesis-section";
import PageLayout from "../../../../../components/container/page-layout";

const StudentCreateThesisPage = () => {
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

      <CreateThesisSection />
    </PageLayout>
  );
};

export default StudentCreateThesisPage;
