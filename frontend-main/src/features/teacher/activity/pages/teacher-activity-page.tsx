import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import PageLayout from "../../../../components/container/page-layout";
import ActivityTable from "../components/activity-table";
import CreateActivityButton from "../components/create-activity-button";

const TeacherActivityPage = () => {
  return (
    <PageLayout>
      <TeacherBreadcrumb title="กิจกรรมการประเมิน" />

      <ActivityTable />

      <CreateActivityButton />
    </PageLayout>
  );
};

export default TeacherActivityPage;
