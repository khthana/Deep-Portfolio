import { generatePath, useParams } from "react-router-dom";
import { paths } from "../../../../routes/paths.config";
import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import BackButton from "../../../../components/button/back-button";
import CreateLearningActivitySection from "../components/create-learning-activity-section";
import PageLayout from "../../../../components/container/page-layout";

const TeacherCreateLearningActivityPage = () => {
  const { secId } = useParams();
  const path = generatePath(paths.teacher.course.learningActivity.list, {
    secId: secId,
  });

  return (
    <PageLayout>
      <TeacherBreadcrumb title="กิจกรรมการเรียนรู้" />

      <BackButton title="เพิ่มกิจกรรมการเรียนรู้" href={path} color="blue" />

      <CreateLearningActivitySection />
    </PageLayout>
  );
};

export default TeacherCreateLearningActivityPage;
