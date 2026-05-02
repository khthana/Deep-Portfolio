import { paths } from "../../../../../routes/paths.config";
import CreateSectionLayout from "../create-section-layout";
import AssignWorkForm from "./create-work-form";

const AddSkillWorkSection = () => {
  return (
    <CreateSectionLayout
      title="เพิ่มผลงาน / กำหนดทักษะ"
      backHref={paths.student.portfolio.experienceSkills.list}
    >
      <AssignWorkForm />
    </CreateSectionLayout>
  );
};

export default AddSkillWorkSection;
