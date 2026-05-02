import { DatePicker, Form, Input } from "antd";
import Button from "../../../../../components/button/button";
import UploadButton from "../../../../../components/input/upload-button";
import { AttachmentType } from "../../../../teacher/announcement/types/announement-type";
import UploadSection from "../upload-section";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(buddhistEra);
dayjs.locale("th");

const CreateProfessionalQualificationForm = () => {
  return (
    <Form layout="vertical">
      <div className="grid grid-cols-3 gap-8">
        <Form.Item label="ปีที่ได้รับ">
          <DatePicker
            size="large"
            className="w-full"
            picker="year"
            format="BBBB"
            placeholder="เลือกปี"
          />
        </Form.Item>

        <Form.Item label="ชื่อเกียรติบัตร / รางวัล">
          <Input size="large" />
        </Form.Item>
        <Form.Item label="หน่วยงานที่มอบให้">
          <Input size="large" />
        </Form.Item>
      </div>

      <Form.Item label="คำอธิบายเพิ่มเติม">
        <Input.TextArea rows={4} size="large" />
      </Form.Item>

      <UploadSection
        onUploadFile={() => console.log("upload")}
        onUploadImage={() => console.log("upload")}
      />

      <div className="text-end">
        <Button>บันทึก</Button>
      </div>
    </Form>
  );
};

export default CreateProfessionalQualificationForm;
