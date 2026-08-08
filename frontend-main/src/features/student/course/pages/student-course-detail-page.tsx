import CourseInfoSection from "../components/course-info-section";
import ScoreWeightTable from "../components/score-weight-table";
import CLOTable from "../components/clo-table";
import LessonPlanTable from "../components/lesson-plan-table";
import { Breadcrumb } from "antd";
import PageLayout from "../../../../components/container/page-layout";
import WhiteContainer from "../../../../components/container/white-container";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../stores/stores";

const StudentCourseDetail = () => {
  const courseSlice = useSelector((state: RootState) => state.studentCourse);

  return (
    <PageLayout>
      <Breadcrumb
        className="breadcrumb-bold"
        separator=">"
        items={[
          {
            title: "USER EXPERIENCE AND USER INTERFACE DESIGN",
          },
          {
            title: "รายละเอียดรายวิชา",
          },
        ]}
      />

      <WhiteContainer>
        <div className="body-bold-1 pb-5 border-b border-light-grey">
          คำอธิบายรายวิชา
        </div>

        <div>{courseSlice.selectedCourse?.course_desc_th}</div>
      </WhiteContainer>

      <div className="grid grid-cols-2 gap-4 2xl:gap-9">
        <CourseInfoSection />
        <ScoreWeightTable />
      </div>

      <CLOTable />
      <LessonPlanTable />
    </PageLayout>
  );
};

export default StudentCourseDetail;
