import { message } from "antd";
import { paths } from "../../../../../routes/paths.config";
import CreateSectionLayout from "../create-section-layout";
import CreateEducationForm from "./create-education-form";

const CreateEducationSection = () => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <CreateSectionLayout
      title="เพิ่มประวัติการศึกษา"
      backHref={paths.student.portfolio.educationTraining.list}
    >
      {contextHolder}
      <CreateEducationForm messageApi={messageApi} />
    </CreateSectionLayout>
  );
};

export default CreateEducationSection;
