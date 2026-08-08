import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import type { RootState } from "../../../../stores/stores";
import { useSelector } from "react-redux";
import CourseInfoSection from "../components/course-info-section";
import ScoreWeightTable from "../components/score-weight-table";
import CLOTable from "../components/clo-table";
import PageLayout from "../../../../components/container/page-layout";
import WhiteContainer from "../../../../components/container/white-container";

const TeacherCourseDetailPage = () => {
  const teacherHomeSlice = useSelector((state: RootState) => state.teacherHome);

  return (
    <PageLayout>
      <TeacherBreadcrumb title="รายละเอียดรายวิชา" />

      <WhiteContainer>
        <div className="body-bold-1 pb-5 border-b border-light-grey">
          คำอธิบายรายวิชา
        </div>

        <div>{teacherHomeSlice.selectedCourse?.course_desc_th}</div>
      </WhiteContainer>

      <div className="grid grid-cols-2 gap-4 2xl:gap-9">
        <CourseInfoSection />
        <ScoreWeightTable />
      </div>

      <CLOTable />
      {/* <ScheduleTable /> */}
    </PageLayout>
  );
};

export default TeacherCourseDetailPage;
