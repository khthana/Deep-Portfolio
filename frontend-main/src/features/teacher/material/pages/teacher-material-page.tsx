import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import PageLayout from "../../../../components/container/page-layout";
import MaterialTable from "../components/material-table";

const TeacherMaterialPage = () => {
  return (
    <PageLayout>
      <TeacherBreadcrumb title="สื่อการสอน" />

      <MaterialTable />
    </PageLayout>
  );
};

export default TeacherMaterialPage;
