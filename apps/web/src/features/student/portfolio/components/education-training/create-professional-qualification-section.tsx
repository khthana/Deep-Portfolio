import { paths } from "../../../../../routes/paths.config";
import CreateSectionLayout from "../create-section-layout";
import CreateProfessionalQualificationForm from "./create-professional-qualification-form";

const CreateProfessionalQualificationSection = () => {
  return (
    <CreateSectionLayout
      backHref={paths.student.portfolio.educationTraining.list}
      title="เพิ่มคุณวุฒิทางวิชาชีพ"
    >
      <CreateProfessionalQualificationForm />
    </CreateSectionLayout>
  );
};

export default CreateProfessionalQualificationSection;
