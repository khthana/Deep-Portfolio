import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import Button from "../../../../components/button/button";
import PageLayout from "../../../../components/container/page-layout";
import WhiteContainer from "../../../../components/container/white-container";
import StudentTable from "../components/student-table";

const TeacherStudentPage = () => {
  return (
    <PageLayout>
      <TeacherBreadcrumb title="นักศึกษา" />

      <WhiteContainer>
        <div className="flex justify-between items-center pb-5 border-b border-light-grey">
          <div className="body-bold-1">ข้อมูลนักศึกษา</div>

          {/* <div className="flex gap-4">
            <Button
              iconSrc="/assets/student/import-icon.svg"
              variant="secondary"
            >
              นำเข้าข้อมูล
            </Button>

            <Button iconSrc="/assets/course/add-icon.svg" variant="secondary">
              เพิ่มข้อมูล
            </Button>
          </div> */}
        </div>

        <StudentTable />
      </WhiteContainer>
    </PageLayout>
  );
};

export default TeacherStudentPage;
