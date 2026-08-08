import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import PageLayout from "../../../../components/container/page-layout";
import LessonPlanTable from "../components/lesson-plan-table";

export const TeacherLessonPlanPage = () => {
  return (
    <PageLayout>
      <TeacherBreadcrumb title="แผนการสอน" />

      <LessonPlanTable />
    </PageLayout>
  );
};
