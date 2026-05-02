import { message } from "antd";
import { paths } from "../../../../../routes/paths.config";
import CreateSectionLayout from "../create-section-layout";
import CreateTrainingForm from "./create-training-form";

const CreateTrainingSection = () => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <CreateSectionLayout
      backHref={paths.student.portfolio.educationTraining.list}
      title="เพิ่มการอบรม"
    >
      {contextHolder}
      <CreateTrainingForm messageApi={messageApi} />
    </CreateSectionLayout>
  );
};

export default CreateTrainingSection;
