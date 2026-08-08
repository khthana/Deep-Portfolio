import { message } from "antd";
import { paths } from "../../../../../routes/paths.config";
import CreateSectionLayout from "../create-section-layout";
import CreateCertificateForm from "./create-certificate-form";

const CreateCertificateSection = () => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <CreateSectionLayout
      backHref={paths.student.portfolio.educationTraining.list}
      title="เพิ่มคุณวุฒิทางวิชาชีพ"
    >
      {contextHolder}
      <CreateCertificateForm messageApi={messageApi} />
    </CreateSectionLayout>
  );
};

export default CreateCertificateSection;
