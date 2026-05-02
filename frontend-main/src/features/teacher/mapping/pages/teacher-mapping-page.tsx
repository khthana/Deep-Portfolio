import { useDispatch, useSelector } from "react-redux";
import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import PageLayout from "../../../../components/container/page-layout";
import MappingSection from "../components/mapping-section";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useEffect } from "react";
import { fetchCLO } from "../../course/stores/teacher-course-action";

const TeacherMappingPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.teacherHome);
  const cloSlice = useSelector((state: RootState) => state.teacherCourse);

  const cloData = cloSlice.cloData.map((clo) => {
    return {
      cloNumber: clo.clo_number,
      detail: clo.clo_detail,
      id: clo.clo_id,
    };
  });

  const fetchCLOData = async () => {
    try {
      if (!homeSlice.selectedCourse) return;

      await dispatch(fetchCLO(homeSlice.selectedCourse.section_id)).unwrap();
    } catch (error) {}
  };

  useEffect(() => {
    fetchCLOData();
  }, [homeSlice.selectedCourse]);

  return (
    <PageLayout>
      <TeacherBreadcrumb title="วางแผนการสอน" />

      <div className="body-bold-1 pb-5 border-b border-light-grey">
        วางแผนรายวิชา
      </div>

      {cloData.length > 0 ? (
        cloData.map((clo) => <MappingSection cloData={clo} />)
      ) : (
        <div className="caption-bold text-primary-red">
          ไม่สามารถวางแผนรายวิชา
          กรุณาเพิ่มผลการเรียนรู้ระดับรายวิชาในหน้ารายละเอียดรายวิชา
        </div>
      )}
    </PageLayout>
  );
};

export default TeacherMappingPage;
