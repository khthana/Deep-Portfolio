import { Breadcrumb } from "antd";
import CreateProfessionalQualificationSection from "../../components/education-training/create-professional-qualification-section";
import PageLayout from "../../../../../components/container/page-layout";

const StudentCreateProfessionalQualificationPage = () => {
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

      <CreateProfessionalQualificationSection />
    </PageLayout>
  );
};

export default StudentCreateProfessionalQualificationPage;
