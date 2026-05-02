import { Breadcrumb } from "antd";
import EPortfolioSection from "../../components/e-portfolio/e-portfolio-section";
import PageLayout from "../../../../../components/container/page-layout";

const StudentEPortfolioPage = () => {
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
            title: "e-Portfolio",
          },
        ]}
      />

      <EPortfolioSection />
    </PageLayout>
  );
};

export default StudentEPortfolioPage;
