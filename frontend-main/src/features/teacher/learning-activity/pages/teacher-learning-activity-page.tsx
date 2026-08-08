import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import PageLayout from "../../../../components/container/page-layout";
import LearningActivityTable from "../components/learning-activity-table";
import CreateLearningActivityButton from "../components/create-learning-activity-button";

const TeacherLearningActivityPage = () => {
  return (
    <PageLayout>
      <TeacherBreadcrumb title="กิจกรรมการเรียนรู้" />

      <LearningActivityTable />

      <CreateLearningActivityButton />
    </PageLayout>
  );
};

export default TeacherLearningActivityPage;
