import { message } from "antd";
import { paths } from "../../../../../routes/paths.config";
import CreateSectionLayout from "../create-section-layout";
import CreateActivityForm from "./create-activity-form";

const CreateActivitySection = () => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <CreateSectionLayout
      title="เพิ่มข้อมูลกิจกรรม"
      backHref={paths.student.portfolio.activities.list}
    >
      {contextHolder}
      <CreateActivityForm messageApi={messageApi} />
    </CreateSectionLayout>
  );
};

export default CreateActivitySection;
