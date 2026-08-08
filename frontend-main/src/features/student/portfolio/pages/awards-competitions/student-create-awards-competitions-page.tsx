import { Breadcrumb } from "antd";
import CreateAwardCompetitionSection from "../../components/awards-competitions/create-award-competition-section";
import PageLayout from "../../../../../components/container/page-layout";

const StudentCreateAwardsCompetitionsPage = () => {
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
            title: "รางวัลและการแข่งขัน",
          },
        ]}
      />

      <CreateAwardCompetitionSection />
    </PageLayout>
  );
};

export default StudentCreateAwardsCompetitionsPage;
