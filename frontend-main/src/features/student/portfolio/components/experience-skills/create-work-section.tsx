import { paths } from "../../../../../routes/paths.config";
import CreateSectionLayout from "../create-section-layout";
import CreateWorkForm from "./create-work-form";

const CreateWorkSection = () => {
  return (
    <CreateSectionLayout
      title="เพิ่มผลงาน / กำหนดทักษะ"
      backHref={paths.student.portfolio.experienceSkills.list}
    >
      <CreateWorkForm />
    </CreateSectionLayout>
  );
};

export default CreateWorkSection;
