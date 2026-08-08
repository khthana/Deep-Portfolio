import { generatePath, useParams } from "react-router-dom";
import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import BackButton from "../../../../components/button/back-button";
import { paths } from "../../../../routes/paths.config";
import CreateActivitySection from "../components/create-activity-section";
import PageLayout from "../../../../components/container/page-layout";

const TeacherCreateActivityPage = () => {
  const { secId } = useParams();
  const path = generatePath(paths.teacher.course.activity.list, {
    secId: secId,
  });

  return (
    <PageLayout>
      <TeacherBreadcrumb title="กิจกรรมการประเมิน" />

      <BackButton title="เพิ่มกิจกรรมการประเมิน" href={path} color="blue" />

      <CreateActivitySection />
    </PageLayout>
  );
};

export default TeacherCreateActivityPage;
