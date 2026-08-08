import BackButton from "../../../../components/button/back-button";
import { paths } from "../../../../routes/paths.config";
import CreateAnnouncementSection from "../components/create-announcement-section";
import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import { useParams, generatePath } from "react-router-dom";
import PageLayout from "../../../../components/container/page-layout";

const TeacherCreateAnnouncementPage = () => {
  const { secId } = useParams();
  const path = generatePath(paths.teacher.course.announcement.list, {
    secId: secId,
  });

  return (
    <PageLayout>
      <TeacherBreadcrumb title="ประกาศ" />

      <BackButton title="เพิ่มประกาศ" href={path} color="blue" />

      <CreateAnnouncementSection />
    </PageLayout>
  );
};

export default TeacherCreateAnnouncementPage;
