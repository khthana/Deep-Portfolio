import { Form, Input, Select } from "antd";
import {
  educationDegreeOptions,
  educationDegreeType,
} from "../../types/education-section-type.type";
import { useState } from "react";
import Button from "../../../../../components/button/button";
import { createPortfolioEducation } from "../../../../../services/portfolio-education.service";
import CountryInput from "../../../../../components/input/country-input";
import type { CreatePortfolioEducationReq } from "../../../../../types/portfolio-education-type.type";
import { useNavigate } from "react-router-dom";
import { paths } from "../../../../../routes/paths.config";

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";
import { convertToCE } from "../../../../../utils/year-utils";
import type { MessageInstance } from "antd/es/message/interface";

type CreateEducationFormProps = {
  messageApi: MessageInstance;
};

const CreateEducationForm = ({ messageApi }: CreateEducationFormProps) => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const [degree, setDegree] = useState<educationDegreeType | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: {
    education_level: educationDegreeType;
    country?: string;
    start_year?: string;
    end_year?: string;
    institution?: string;
    faculty?: string;
    major?: string;
    gpa?: string;
    study_plan?: string;
  }) => {
    try {
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
      const payload: CreatePortfolioEducationReq = {
        user_id: studentId,
        education_level: values.education_level,
        country: values.country,
        start_year: convertToCE(values.start_year),
        end_year: convertToCE(values.end_year),
        institution: values.institution,
        faculty: values.faculty,
        major: values.major,
        gpa: values.gpa ? Number(values.gpa) : undefined,
        study_plan: values.study_plan,
        is_show: true, // Default to show
      };

      await createPortfolioEducation(payload);
      messageApi.success("เพิ่มข้อมูลประวัติการศึกษาเรียบร้อยแล้ว");
      navigate(paths.student.portfolio.educationTraining.list);
    } catch (error: unknown) {
      console.error("Error creating education:", error);
      messageApi.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูลประวัติการศึกษา");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form layout="vertical" form={form} onFinish={onFinish}>
      <div className="grid grid-cols-3 gap-x-8">
        <Form.Item label="ปีเริ่มศึกษา (พ.ศ.)" name="start_year">
          <Input size="large" type="number" placeholder="เช่น 2564" />
        </Form.Item>
        <Form.Item label="ปีจบการศึกษา" name="end_year">
          <Input
            size="large"
            type="number"
            placeholder="เช่น 2567 (ว่างไว้หากกำลังศึกษา)"
          />
        </Form.Item>
        <Form.Item label="ประเทศ" name="country">
          <CountryInput size="large" />
        </Form.Item>
        <Form.Item
          label="ระดับการศึกษา"
          name="education_level"
          rules={[{ required: true, message: "กรุณาระบุระดับการศึกษา" }]}
        >
          <Select
            size="large"
            options={educationDegreeOptions}
            onChange={(value: educationDegreeType) => setDegree(value)}
          />
        </Form.Item>
      </div>

      {degree === educationDegreeType.BACHELOR ? (
        <BachelorForm />
      ) : degree === educationDegreeType.HIGH_SCHOOL ? (
        <HighSchoolForm />
      ) : null}

      <div className="text-end mt-4">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          className="bg-[#0e305cff] text-white"
        >
          บันทึก
        </Button>
      </div>
    </Form>
  );
};

//----------------------------------------

const BachelorForm = () => {
  return (
    <div className="grid grid-cols-7 gap-8">
      <Form.Item
        label="สถาบันการศึกษา"
        className="col-span-2"
        name="institution"
      >
        <Input
          size="large"
          placeholder="เช่น สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง"
        />
      </Form.Item>
      <Form.Item label="คณะ" className="col-span-2" name="faculty">
        <Input size="large" placeholder="เช่น คณะวิศวกรรมศาสตร์" />
      </Form.Item>
      <Form.Item label="สาขาวิชา" className="col-span-2" name="major">
        <Input size="large" placeholder="เช่น สาขาวิชาวิศวกรรมคอมพิวเตอร์" />
      </Form.Item>
      <Form.Item label="เกรดเฉลี่ย" name="gpa">
        <Input size="large" type="number" step="0.01" placeholder="เช่น 3.50" />
      </Form.Item>
    </div>
  );
};

//----------------------------------------

const HighSchoolForm = () => {
  return (
    <div className="grid grid-cols-3 gap-8">
      <Form.Item label="สถาบันการศึกษา" name="institution">
        <Input size="large" placeholder="เช่น โรงเรียนเตรียมอุดมศึกษา" />
      </Form.Item>
      <Form.Item label="แผนการเรียน" name="study_plan">
        <Input size="large" placeholder="เช่น วิทย์-คณิต" />
      </Form.Item>
      <Form.Item label="เกรดเฉลี่ย" name="gpa">
        <Input size="large" type="number" step="0.01" placeholder="เช่น 3.50" />
      </Form.Item>
    </div>
  );
};

export default CreateEducationForm;
