import { Breadcrumb, Table, type TableProps } from "antd";
import PageLayout from "../../../../components/container/page-layout";
import EvaluationTable from "../components/evaluation/evaluation-table";

const StudentCourseEvaluationPage = () => {
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
            title: "ผลการประเมิน",
          },
        ]}
      />

      <EvaluationTable />
    </PageLayout>
  );
};

export default StudentCourseEvaluationPage;
