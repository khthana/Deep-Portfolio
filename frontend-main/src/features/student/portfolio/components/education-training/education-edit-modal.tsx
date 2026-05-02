import { Modal, Form, Input, Select, Checkbox } from "antd";
import { useEffect, useState } from "react";
import Button from "../../../../../components/button/button";
import { updatePortfolioEducation } from "../../../../../services/portfolio-education.service";
import CountryInput from "../../../../../components/input/country-input";
import { educationDegreeOptions } from "../../types/education-section-type.type";
import type { PortfolioEducationResp } from "../../../../../types/portfolio-education-type.type";
import type { UpdatePortfolioEducationReq } from "../../../../../types/portfolio-education-type.type";
import { convertToBE, convertToCE } from "../../../../../utils/year-utils";
import type { MessageInstance } from "antd/es/message/interface";

type EducationEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  data: PortfolioEducationResp | null;
  messageApi: MessageInstance;
};

const EducationEditModal = ({
  isOpen,
  onClose,
  onSuccess,
  data,
  messageApi,
}: EducationEditModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [degree, setDegree] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && data) {
      setDegree(data.education_level);
      form.setFieldsValue({
        education_level: data.education_level,
        country: data.country,
        start_year: convertToBE(data.start_year),
        end_year: convertToBE(data.end_year),
        institution: data.institution,
        faculty: data.faculty,
        major: data.major,
        gpa: data.gpa,
        study_plan: data.study_plan,
        is_show: data.is_show,
      });
    } else {
      form.resetFields();
      setDegree(null);
    }
  }, [isOpen, data, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const currentYearBE = new Date().getFullYear() + 543;

      if (values.start_year) {
        const startYearNum = parseInt(values.start_year);
        if (startYearNum > currentYearBE) {
          messageApi.error("ปีเริ่มศึกษาไม่ควรเกินปีปัจจุบัน");
          return;
        }
        if (startYearNum <= 0) {
          messageApi.error("ปีเริ่มศึกษาต้องมากกว่า 0");
          return;
        }

        if (values.end_year) {
          const endYearNum = parseInt(values.end_year);
          if (startYearNum > endYearNum) {
            messageApi.error("ปีเริ่มศึกษาควรน้อยกว่าหรือเท่ากับปีจบการศึกษา");
            return;
          }
          if (endYearNum <= 0) {
            messageApi.error("ปีจบการศึกษาต้องมากกว่า 0");
            return;
          }
        }
      }

      setLoading(true);

      if (!data?.id) return;

      const payload: UpdatePortfolioEducationReq = {
        ...values,
        gpa: values.gpa ? Number(values.gpa) : undefined,
        start_year: convertToCE(values.start_year),
        end_year: values.end_year ? convertToCE(values.end_year) : null,
        is_show: values.is_show,
        // Clear irrelevant fields based on degree type
        faculty: degree === "HIGH_SCHOOL" ? null : values.faculty,
        major: degree === "HIGH_SCHOOL" ? null : values.major,
        study_plan: degree !== "HIGH_SCHOOL" ? null : values.study_plan,
      };

      await updatePortfolioEducation(data.id, payload);

      messageApi.success("แก้ไขข้อมูลประวัติการศึกษาเรียบร้อยแล้ว");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      messageApi.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <h2 className="body-bold-1 text-primary-orange my-4">
          แก้ไขประวัติการศึกษา
        </h2>
      }
      open={isOpen}
      onCancel={onClose}
      width={800}
      footer={
        <div className="flex justify-end gap-4 my-4">
          <Button onClick={onClose} variant="secondary">
            ยกเลิก
          </Button>
          <Button
            variant="primary"
            onClick={handleOk}
            loading={loading}
            className="bg-[#0e305cff] text-white"
          >
            บันทึก
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <Form.Item label="ระดับการศึกษา" name="education_level">
            <Select
              size="large"
              options={educationDegreeOptions}
              value={degree}
              onChange={(value) => setDegree(value)}
            />
          </Form.Item>
          <Form.Item label="ประเทศ" name="country">
            <CountryInput size="large" />
          </Form.Item>
          {/* <div className="col-span-1"></div> */}

          <Form.Item label="ปีเริ่มศึกษา (พ.ศ.)" name="start_year">
            <Input size="large" type="number" placeholder="เช่น 2564" />
          </Form.Item>
          <Form.Item label="ปีจบการศึกษา (พ.ศ.)" name="end_year">
            <Input
              size="large"
              type="number"
              placeholder="เช่น 2567 (ว่างไว้หากกำลังศึกษา)"
            />
          </Form.Item>
          <div className="col-span-1"></div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <Form.Item
            label="สถาบันการศึกษา"
            name="institution"
            className="col-span-2"
          >
            <Input size="large" placeholder="เช่น สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง" />
          </Form.Item>

          {degree !== "HIGH_SCHOOL" && (
            <>
              <Form.Item label="คณะ" name="faculty">
                <Input size="large" placeholder="เช่น คณะวิศวกรรมศาสตร์" />
              </Form.Item>
              <Form.Item label="สาขาวิชา" name="major">
                <Input
                  size="large"
                  placeholder="เช่น สาขาวิชาวิศวกรรมคอมพิวเตอร์"
                />
              </Form.Item>
            </>
          )}

          {degree === "HIGH_SCHOOL" && (
            <Form.Item label="แผนการเรียน" name="study_plan">
              <Input size="large" placeholder="เช่น วิทย์-คณิต" />
            </Form.Item>
          )}

          <Form.Item label="เกรดเฉลี่ย" name="gpa">
            <Input
              size="large"
              type="number"
              step="0.01"
              placeholder="เช่น 3.50"
            />
          </Form.Item>

          <Form.Item
            name="is_show"
            valuePropName="checked"
            className="flex items-end mb-2"
          >
            <Checkbox>แสดงบนหน้าเว็บผลงาน</Checkbox>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default EducationEditModal;
