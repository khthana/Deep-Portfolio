import { Breadcrumb } from "antd";
import AwardCompetitionSection from "../../components/awards-competitions/award-competition-section";
import PageLayout from "../../../../../components/container/page-layout";

const StudentAwardsCompetitionsPage = () => {
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

      <AwardCompetitionSection />
    </PageLayout>
  );
};

export default StudentAwardsCompetitionsPage;
