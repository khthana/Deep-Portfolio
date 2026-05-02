import { Breadcrumb } from "antd";
import { useSelector } from "react-redux";
import type { RootState } from "../../stores/stores";

type Props = {
  title: string;
  subtitle?: string;
};

const TeacherBreadcrumb = (props: Props) => {
  const teacherHomeSlice = useSelector((state: RootState) => state.teacherHome);

  return (
    <>
      {!props.subtitle ? (
        <Breadcrumb
          className="breadcrumb-bold blue"
          separator=">"
          items={[
            {
              title: teacherHomeSlice.selectedCourse?.course_name_en,
              // className: "!color-secondary-blue",
            },
            {
              title: props.title,
            },
          ]}
        />
      ) : (
        <Breadcrumb
          className="breadcrumb-bold blue subtitle"
          separator=">"
          items={[
            {
              title: teacherHomeSlice.selectedCourse?.course_name_en,
              // className: "!color-secondary-blue",
            },
            {
              title: props.title,
              // className: "!color-secondary-blue",
            },
            {
              title: props.subtitle,
            },
          ]}
        />
      )}
    </>
  );
};

export default TeacherBreadcrumb;
