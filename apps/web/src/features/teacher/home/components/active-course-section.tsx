import { useSelector } from "react-redux";
import type { RootState } from "../../../../stores/stores";
import CourseCard from "./course-card";

type Props = {
  type: "ACTIVE" | "ARCHIVED";
};

const TabCourseSection = (props: Props) => {
  const teacherHomeSlice = useSelector((state: RootState) => state.teacherHome);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
      {props.type === "ACTIVE" &&
        teacherHomeSlice.activeCourse.length > 0 &&
        teacherHomeSlice.activeCourse.map((course) => (
          <CourseCard key={course.section_id} course={course} />
        ))}
      {props.type === "ARCHIVED" &&
        teacherHomeSlice.archivedCourse.length > 0 &&
        teacherHomeSlice.archivedCourse.map((course) => (
          <CourseCard key={course.section_id} course={course} />
        ))}
    </div>
  );
};

export default TabCourseSection;
