import { message } from "antd";
import { paths } from "../../../../../routes/paths.config";
import CreateSectionLayout from "../create-section-layout";
import CreateExperienceForm from "./create-experience-form";

const CreateExperienceSection = () => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <CreateSectionLayout
      title="เพิ่มข้อมูลการฝึกงาน/สหกิจศึกษา"
      backHref={paths.student.portfolio.experienceSkills.list}
    >
      {contextHolder}
      <CreateExperienceForm messageApi={messageApi} />
    </CreateSectionLayout>
  );
};

export default CreateExperienceSection;
