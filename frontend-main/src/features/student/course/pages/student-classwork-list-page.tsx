import { Breadcrumb } from "antd";
import ClassworkCard from "../components/classwork-card";
import ClassworkGroup from "../components/classwork-group";
import PageLayout from "../../../../components/container/page-layout";
import {
  fetchCourseClasswork,
  fetchScoreWeight,
} from "../stores/course-action";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";

const StudentClassworkListPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const courseSlice = useSelector((state: RootState) => state.studentCourse);
  const homeSlice = useSelector((state: RootState) => state.home);

  const handleFetchActivities = async () => {
    if (!courseSlice.selectedCourse) return;

    dispatch(
      fetchCourseClasswork({
        student_id: homeSlice.studentId,
        section_id: courseSlice.selectedCourse.section_id,
      }),
    );
  };

  const handleFetchScoreWeight = async () => {
    if (!courseSlice.selectedCourse) return;

    dispatch(fetchScoreWeight(courseSlice.selectedCourse.section_id));
  };

  useEffect(() => {
    handleFetchActivities();
  }, [courseSlice.selectedCourse]);

  useEffect(() => {
    if (courseSlice.scoreWeight.length === 0) {
      handleFetchScoreWeight();
    }
  }, [courseSlice.scoreWeight, courseSlice.selectedCourse]);

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
            title: "งานในชั้นเรียน",
          },
        ]}
      />

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 border-b border-light-grey pb-5">
          <div className="body-bold-1 text-primary-orange">ส่งวันนี้</div>
          <div className="flex justify-center">
            <div className="w-full px-6 flex flex-col gap-4 items-center">
              {courseSlice.allClasswork &&
              courseSlice.allClasswork.today.length > 0 ? (
                courseSlice.allClasswork.today.map((classwork, index) => (
                  <ClassworkCard key={index} classworkDetail={classwork} />
                ))
              ) : (
                <div className="text-left caption-bold text-primary-grey w-full">
                  ไม่มีงานที่ต้องส่งในวันนี้
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="body-bold-1 text-primary-orange">งานทั้งหมด</div>

          {courseSlice.allClasswork &&
            courseSlice.allClasswork.other.map((classwork, index) => (
              <ClassworkGroup
                key={index}
                groupName={classwork.title}
                classworks={classwork.classworks}
              />
            ))}
          {/* <ClassworkGroup
            groupName="Activities 68"
            classworks={activitiesData}
          />
          <ClassworkGroup
            groupName="Final Project 68"
            classworks={classworkData}
          /> */}
        </div>
      </div>
    </PageLayout>
  );
};

export default StudentClassworkListPage;
