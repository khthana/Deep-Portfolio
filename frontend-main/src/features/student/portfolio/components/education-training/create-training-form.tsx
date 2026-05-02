import { Form, Input, Upload, message, Image } from "antd";
import { useState } from "react";
import type { UploadFile } from "antd";
import { useNavigate } from "react-router-dom";
import TextArea from "antd/es/input/TextArea";
import Button from "../../../../../components/button/button";
import { createPortfolioTraining } from "../../../../../services/portfolio-training.service";
import CountryInput from "../../../../../components/input/country-input";
import { paths } from "../../../../../routes/paths.config";
import type { CreatePortfolioTrainingReq } from "../../../../../types/portfolio-training-type.type";

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";
import { convertToCE } from "../../../../../utils/year-utils";

import type { MessageInstance } from "antd/es/message/interface";
import dayjs from "dayjs";

type CreateTrainingFormProps = {
  messageApi: MessageInstance;
};

const CreateTrainingForm = ({ messageApi }: CreateTrainingFormProps) => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const navigate = useNavigate();
  const [form] = Form.useForm();
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

  const onFinish = async (values: {
    year?: string;
    country?: string;
    organize?: string;
    name: string;
    description?: string;
  }) => {
    if (values.year) {
      if (parseInt(values.year) > dayjs().year() + 543) {
        messageApi.error("ปีที่อบรมไม่สามารถเป็นอนาคตได้");
        return;
      }
      if (parseInt(values.year) <= 0) {
        messageApi.error("ปีที่อบรมต้องมากกว่า 0");
        return;
      }
    }

    try {
      setLoading(true);
      const payload: CreatePortfolioTrainingReq = {
        user_id: studentId,
        year: convertToCE(values.year),
        country: values.country,
        organize: values.organize,
        name: values.name,
        description: values.description,
        is_show: true,
      };

      const files = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj as File);

      await createPortfolioTraining(payload, files);
      messageApi.success("เพิ่มข้อมูลการฝึกอบรมเรียบร้อยแล้ว");
      navigate(paths.student.portfolio.educationTraining.list);
    } catch (error: any) {
      console.error("Error creating training:", error);
      const errorMessage =
        error.response?.data?.message ||
        "เกิดข้อผิดพลาดในการเพิ่มข้อมูลการอบรม";
      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form
        layout="vertical"
        form={form}
        onFinish={onFinish}
        className="grid grid-cols-2 gap-x-8"
      >
        <Form.Item label="ปีที่อบรม (พ.ศ.)" name="year">
          <Input size="large" type="number" placeholder="เช่น 2566" />
        </Form.Item>
        <Form.Item label="ประเทศ" name="country">
          <CountryInput size="large" />
        </Form.Item>
        <Form.Item label="หน่วยงานที่จัด" name="organize">
          <Input size="large" placeholder="เช่น Google Thailand" />
        </Form.Item>
        <Form.Item
          label="หัวข้ออบรม"
          name="name"
          rules={[{ required: true, message: "กรุณากรอกหัวข้ออบรม" }]}
        >
          <Input size="large" placeholder="เช่น การเขียนโปรแกรม..." />
        </Form.Item>
        <Form.Item
          label="คำอธิบายเพิ่มเติม"
          name="description"
          className="col-span-2"
        >
          <TextArea
            rows={4}
            size="large"
            placeholder="ระบุรายละเอียดการอบรม เช่น เนื้อหาที่เรียน ทักษะที่ได้..."
          />
        </Form.Item>

        <Form.Item label="ไฟล์แนบ (รูปภาพ, ใบประกาศ)" className="col-span-2">
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

        <div className="text-end col-span-2 mt-4">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="bg-[#0e305cff] text-white"
          >
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
    </>
  );
};

export default CreateTrainingForm;
