import { Breadcrumb } from "antd";
import CreateTrainingSection from "../../components/education-training/create-training-section";
import PageLayout from "../../../../../components/container/page-layout";

const StudentCreateTrainingPage = () => {
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

      <CreateTrainingSection />
    </PageLayout>
  );
};

export default StudentCreateTrainingPage;
