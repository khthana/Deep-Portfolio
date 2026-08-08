import { Breadcrumb } from "antd";
import CreateActivitySection from "../../components/activities/create-activity-section";
import PageLayout from "../../../../../components/container/page-layout";

const StudentCreateActivitiesPage = () => {
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

      <CreateActivitySection />
    </PageLayout>
  );
};

export default StudentCreateActivitiesPage;
