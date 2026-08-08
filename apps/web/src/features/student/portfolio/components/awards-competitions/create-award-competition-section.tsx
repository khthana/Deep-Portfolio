import { message } from "antd";
import { paths } from "../../../../../routes/paths.config";
import CreateSectionLayout from "../create-section-layout";
import CreateAwardCompetitionForm from "./create-award-competition-form";

const CreateAwardCompetitionSection = () => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <CreateSectionLayout
      title="เพิ่มข้อมูลรางวัลและการแข่งขัน"
      backHref={paths.student.portfolio.awardsCompetitions.list}
    >
      {contextHolder}
      <CreateAwardCompetitionForm messageApi={messageApi} />
    </CreateSectionLayout>
  );
};

export default CreateAwardCompetitionSection;
