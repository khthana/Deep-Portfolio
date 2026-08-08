import { Breadcrumb } from "antd";
import CreateCertificateSection from "../../components/education-training/create-certificate-section";
import PageLayout from "../../../../../components/container/page-layout";

const StudentCreateCertificatePage = () => {
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

      <CreateCertificateSection />
    </PageLayout>
  );
};

export default StudentCreateCertificatePage;
