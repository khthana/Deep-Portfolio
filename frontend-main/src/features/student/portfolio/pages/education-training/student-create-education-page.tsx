import { Breadcrumb } from "antd";
import CreateEducationSection from "../../components/education-training/create-education-section";
import PageLayout from "../../../../../components/container/page-layout";

const StudentCreateEducationPage = () => {
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
            title: "การศึกษาและการอบรม",
          },
        ]}
      />

      <CreateEducationSection />
    </PageLayout>
  );
};

export default StudentCreateEducationPage;
