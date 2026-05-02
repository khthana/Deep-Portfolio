import { Breadcrumb } from "antd";
import ActivitySection from "../../components/activities/activity-section";
import PageLayout from "../../../../../components/container/page-layout";

const StudentActivitiesPage = () => {
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
            title: "กิจกรรมและอื่น ๆ",
          },
        ]}
      />

      <ActivitySection />
    </PageLayout>
  );
};

export default StudentActivitiesPage;
