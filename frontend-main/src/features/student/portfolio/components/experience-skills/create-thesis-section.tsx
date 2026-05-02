import { paths } from "../../../../../routes/paths.config";
import CreateSectionLayout from "../create-section-layout";
import CreateThesisForm from "./create-thesis-form";

const CreateThesisSection = () => {
  return (
    <CreateSectionLayout
      title="เพิ่มโครงงานปริญญาตรี"
      backHref={paths.student.portfolio.experienceSkills.list}
    >
      <CreateThesisForm />
    </CreateSectionLayout>
  );
};

export default CreateThesisSection;
