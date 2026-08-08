import { paths } from "../../../../../routes/paths.config";
import CreateSectionLayout from "../create-section-layout";
import AssignWorkForm from "./create-work-form";

const CreateSkillSection = () => {
  return (
    <CreateSectionLayout
      backHref={paths.student.portfolio.experienceSkills.list}
      title="เพิ่มผลงาน / กำหนดทักษะ"
    >
      <AssignWorkForm />
    </CreateSectionLayout>
  );
};

export default CreateSkillSection;
