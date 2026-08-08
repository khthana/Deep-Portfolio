import { Tabs, type TabsProps } from "antd";
import TabCourseSection from "../components/active-course-section";
import { useEffect } from "react";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllCourse } from "../stores/teacher-home-action";
import type { GetAllCoursesParams } from "../types/home-type";

const tabOptions: TabsProps["items"] = [
  {
    key: "ACTIVE",
    label: "ปัจจุบัน",
    children: <TabCourseSection type="ACTIVE" />,
  },
  {
    key: "ARCHIVED",
    label: "จัดเก็บ",
    children: <TabCourseSection type="ARCHIVED" />,
  },
];

const TeacherHomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const teacherHomeSlice = useSelector((state: RootState) => state.teacherHome);

  const handleFetchAllCourse = async () => {
    const params: GetAllCoursesParams = {
      teacher_id: teacherHomeSlice.user_id,
      semester: teacherHomeSlice.semester,
      academic_year: teacherHomeSlice.academicYear,
    };

    await dispatch(fetchAllCourse(params));
  };

  useEffect(() => {
    handleFetchAllCourse();
  }, []);

  return (
    <div className="w-9/12 flex flex-col gap-4">
      <div className="flex gap-4">
        <img
          src="/assets/sidebar/book-blue-icon.svg"
          className="w-8"
          alt="book active icon"
        />
        <div className="body-bold-1 text-secondary-blue">วิชาที่สอน</div>
      </div>

      <Tabs items={tabOptions} defaultActiveKey="ACTIVE" />
    </div>
  );
};

export default TeacherHomePage;
