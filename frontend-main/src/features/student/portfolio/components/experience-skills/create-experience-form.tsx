import { Form, Input, Select, DatePicker, message, Upload, Image } from "antd";
import type { ValidateErrorEntity } from "rc-field-form/lib/interface";
import { useState } from "react";
import type { UploadFile } from "antd";
import { useNavigate } from "react-router-dom";
// import TextArea from "antd/es/input/TextArea";
import Button from "../../../../../components/button/button";
import { createPortfolioInternship } from "../../../../../services/portfolio-internship.service";
import CountryInput from "../../../../../components/input/country-input";
import ProvinceInput from "../../../../../components/input/province-input";
import TextAreaWithCheckbox from "../text-area-with-checkbox";
// import { paths } from "../../../../../routes/paths.config";
import type { CreatePortfolioInternshipReq } from "../../../../../types/portfolio-internship-type.type";
import {
  programOptions,
  ProgramType,
} from "../../types/experience-skill-type.type";
import type { ProgramTypeValue } from "../../types/experience-skill-type.type";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(buddhistEra);
dayjs.locale("th");

interface FormValues {
  title?: string;
  company: string;
  country: string;
  province: string;
  start_date: dayjs.Dayjs;
  end_date: dayjs.Dayjs;
  position: string;
  department: string;
  resp: string;
  learning_out: string;
  reflection: string;
}

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

import type { MessageInstance } from "antd/es/message/interface";

interface CreateExperienceFormProps {
  messageApi: MessageInstance;
}

const CreateExperienceForm = ({ messageApi }: CreateExperienceFormProps) => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [programType, setProgramType] = useState<ProgramTypeValue>(
    ProgramType.INTERNSHIP,
  );
  const [showResponsibilities, setShowResponsibilities] =
    useState<boolean>(true);
  const [showLearningOutcomes, setShowLearningOutcomes] =
    useState<boolean>(true);
  const [showReflections, setShowReflections] = useState<boolean>(true);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handlePreview = async (file: UploadFile) => {
    let src = file.url as string;
    if (!src) {
      src = await getBase64(file.originFileObj as File);
    }

    const isPdf =
      file.name?.toLowerCase().endsWith(".pdf") ||
      src.startsWith("data:application/pdf");

    if (isPdf) {
      const pdfWindow = window.open("");
      if (pdfWindow) {
        pdfWindow.document.write(
          `<iframe width='100%' height='100%' src='${src}'></iframe>`,
        );
      }
      return;
    }

    setPreviewImage(src);
    setPreviewOpen(true);
  };

  const onFinish = async (values: FormValues) => {
    if (values.start_date) {
      if (values.start_date.isAfter(dayjs())) {
        messageApi.error("วันที่เริ่มไม่สามารถเป็นอนาคตได้");
        return;
      }
      if (values.start_date.year() <= 0) {
        messageApi.error("ปีที่เริ่มต้องมากกว่า 0");
        return;
      }
    }

    if (values.end_date) {
      if (values.end_date.isAfter(dayjs())) {
        messageApi.error("วันที่สิ้นสุดไม่สามารถเป็นอนาคตได้");
        return;
      }
      if (values.end_date.year() <= 0) {
        messageApi.error("ปีที่สิ้นสุดต้องมากกว่า 0");
        return;
      }
    }

    if (
      values.start_date &&
      values.end_date &&
      values.start_date.isAfter(values.end_date)
    ) {
      messageApi.error("วันที่เริ่มไม่สามารถมากกว่าวันที่สิ้นสุดได้");
      return;
    }

    setLoading(true);
    try {
      const reqData: CreatePortfolioInternshipReq = {
        user_id: studentId,
        type: programType,
        company: values.company,
        country: values.country,
        province: values.province || "-", // Default if empty
        start_date: values.start_date?.toISOString(),
        end_date: values.end_date?.toISOString(),
        position: values.position,
        // job_desc: values.job_desc, // Removed
        resp: values.resp,
        is_show_resp: showResponsibilities,
        learning_out: values.learning_out,
        is_show_learning: showLearningOutcomes,
        reflection: values.reflection,
        is_show_reflec: showReflections,
        title: programType === "COOP" ? values.title : undefined,
      };

      const files = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj as File);

      await createPortfolioInternship(reqData, files);
      messageApi.success("เพิ่มข้อมูลประวัติการทำงานเรียบร้อยแล้ว");
      navigate(-1);
    } catch (error) {
      console.error("Error creating experience:", error);
      messageApi.error("ไม่สามารถสร้างประสบการณ์ได้");
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo: ValidateErrorEntity<FormValues>) => {
    console.error("Form validation failed:", errorInfo);
    messageApi.error("กรุณากรอกข้อมูลให้ครบถ้วน");
  };

  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <div className="flex gap-8">
        <Form.Item label="ประเภท" className="w-75">
          <Select
            options={programOptions}
            size="large"
            value={programType}
            onChange={(value: ProgramTypeValue) => {
              console.log("Program Type changed to:", value);
              setProgramType(value);
            }}
          />
        </Form.Item>
        {programType === "COOP" && (
          <Form.Item label="หัวข้อ" name="title" className="w-75">
            <Input size="large" placeholder="เช่น โครงการพัฒนาแอพพลิเคชัน" />
          </Form.Item>
        )}
        <Form.Item label="ตำแหน่ง" name="position" className="w-75">
          <Input size="large" placeholder="เช่น Software Engineer Intern" />
        </Form.Item>

        <Form.Item label="หน่วยงาน/บริษัท" name="company" className="flex-1">
          <Input size="large" placeholder="เช่น Google Thailand" />
        </Form.Item>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <Form.Item label="ประเทศ" name="country">
          <CountryInput size="large" />
        </Form.Item>
        <Form.Item label="จังหวัด" name="province">
          <ProvinceInput size="large" />
        </Form.Item>
        <Form.Item label="วันที่เริ่ม" name="start_date">
          <DatePicker
            size="large"
            className="w-full"
            format="DD/MM/BBBB"
            placeholder="เลือกวันที่"
          />
        </Form.Item>
        <Form.Item label="วันที่สิ้นสุด" name="end_date">
          <DatePicker
            size="large"
            className="w-full"
            format="DD/MM/BBBB"
            placeholder="เลือกวันที่"
          />
        </Form.Item>
      </div>

      {/* Removed separate job_desc field as it is now position above */}

      <TextAreaWithCheckbox
        isShow={showResponsibilities}
        setIsShow={setShowResponsibilities}
        label="หน้าที่ความรับผิดชอบ"
        name="resp"
      />
      <TextAreaWithCheckbox
        isShow={showLearningOutcomes}
        setIsShow={setShowLearningOutcomes}
        label="สิ่งที่เรียนรู้จากการทำงาน"
        name="learning_out"
      />
      <TextAreaWithCheckbox
        isShow={showReflections}
        setIsShow={setShowReflections}
        label="สิ่งที่สะท้อนความคิดจากการทำงาน"
        name="reflection"
      />

      <Form.Item label="ไฟล์แนบ (รูปภาพ, เอกสาร)" className="col-span-2">
        <Upload
          fileList={fileList}
          onChange={({ file, fileList }) => {
            if (file.status === "uploading") {
              setFileList(fileList);
              return;
            }

            if (file.size && file.size < 10 * 1024 * 1024) {
              setFileList(fileList);
              if (file.status === "done") {
                messageApi.success("เพิ่มไฟล์สำเร็จ");
              }
            } else if (file.size) {
              messageApi.error("ไฟล์เกินขนาดที่กำหนด");
              setFileList(fileList.filter((f) => f.uid !== file.uid));
            } else {
              setFileList(fileList);
            }
          }}
          onPreview={handlePreview}
          beforeUpload={() => false}
          multiple
          listType="picture-card"
          accept=".pdf,.docx,.doc,.txt,.xls,.xlsx,.ods,.ppt,.pptx,.csv,.jpg,.jpeg,.png,.mp4"
        >
          <button style={{ border: 0, background: "none" }} type="button">
            <div className="text-2xl text-gray-400">+</div>
            <div style={{ marginTop: 8 }}>เลือกไฟล์</div>
          </button>
        </Upload>
      </Form.Item>

      <div className="text-end">
        <Button type="submit" loading={loading}>
          บันทึก
        </Button>
      </div>
      <div style={{ display: "none" }}>
        <Image
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            src: previewImage,
          }}
        />
      </div>
    </Form>
  );
};

export default CreateExperienceForm;
