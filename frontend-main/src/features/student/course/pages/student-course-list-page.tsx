import { useDispatch, useSelector } from "react-redux";
import PageLayout from "../../../../components/container/page-layout";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import CourseCard from "../components/course-card";
import { fetchStudentCourseList } from "../stores/course-action";
import { useEffect, useState } from "react";
import type { GetStudentCourseListParams } from "../types/course-type";
import type { CourseDetail } from "../../../../types/course-type.type";

const StudentCourseListPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.home);
  const courseSlice = useSelector((state: RootState) => state.studentCourse);

  const handleFetchCourseList = async () => {
    const params: GetStudentCourseListParams = {
      student_id: homeSlice.studentId,
      semester: homeSlice.semester,
      academic_year: homeSlice.academicYear,
    };
    await dispatch(fetchStudentCourseList(params));
  };

  useEffect(() => {
    if (!courseSlice.isFetchStudentCourseList) {
      handleFetchCourseList();
    }
  }, [courseSlice.courseList]);

  return (
    <PageLayout>
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <img
            src="/assets/sidebar/book-active-icon.svg"
            alt="book active icon"
            width={32}
          />
          <div className="body-bold-1 text-primary-orange">รายวิชา</div>
        </div>

        <div className="body-medium-3 text-primary-grey">
          ภาคการศึกษา {homeSlice.semester}/{homeSlice.academicYear}
        </div>
      </div>

      {courseSlice.courseList.map((course) => (
        <CourseCard key={course.section_id} course={course} />
      ))}
    </PageLayout>
  );
};

export default StudentCourseListPage;
