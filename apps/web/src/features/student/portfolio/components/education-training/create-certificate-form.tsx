import { Form, Input, Upload, message, DatePicker, Image } from "antd";
import { useState } from "react";
import type { UploadFile } from "antd";
import { useNavigate } from "react-router-dom";
import TextArea from "antd/es/input/TextArea";
import Button from "../../../../../components/button/button";
import { createPortfolioCertificate } from "../../../../../services/portfolio-certificate.service";
import { paths } from "../../../../../routes/paths.config";
import type { CreatePortfolioCertificateReq } from "../../../../../types/portfolio-certificate-type.type";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(buddhistEra);
dayjs.locale("th");

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

import type { MessageInstance } from "antd/es/message/interface";

type CreateCertificateFormProps = {
  messageApi: MessageInstance;
};

const CreateCertificateForm = ({ messageApi }: CreateCertificateFormProps) => {
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

    // Check if it's a PDF
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
    date?: dayjs.Dayjs;
    organize?: string;
    name: string;
    description?: string;
  }) => {
    if (values.date) {
      if (values.date.isAfter(dayjs())) {
        messageApi.error("วันที่ได้รับไม่สามารถเป็นอนาคตได้");
        return;
      }
      if (values.date.year() <= 0) {
        messageApi.error("ปีที่ได้รับต้องมากกว่า 0");
        return;
      }
    }

    try {
      setLoading(true);
      const payload: CreatePortfolioCertificateReq = {
        user_id: studentId,
        date: values.date ? values.date.format("YYYY-MM-DD") : undefined,
        organize: values.organize,
        name: values.name,
        description: values.description,
        is_show: true,
      };

      const files = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj as File);

      await createPortfolioCertificate(payload, files);
      messageApi.success("เพิ่มข้อมูลคุณวุฒิทางวิชาชีพเรียบร้อยแล้ว");
      navigate(paths.student.portfolio.educationTraining.list);
    } catch (error: any) {
      console.error("Error creating certificate:", error);
      const errorMessage =
        error.response?.data?.message ||
        "เกิดข้อผิดพลาดในการเพิ่มข้อมูลคุณวุฒิทางวิชาชีพ";
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
        <Form.Item label="วันที่ได้รับ" name="date">
          <DatePicker
            size="large"
            className="w-full"
            format="DD/MM/BBBB"
            placeholder="เลือกวันที่"
          />
        </Form.Item>
        <Form.Item
          label="ชื่อคุณวุฒิ"
          name="name"
          rules={[{ required: true, message: "กรุณากรอกชื่อคุณวุฒิ" }]}
        >
          <Input
            size="large"
            placeholder="เช่น Cisco Certified Network Associate (CCNA)"
          />
        </Form.Item>
        <Form.Item
          label="หน่วยงานที่ออก"
          name="organize"
          className="col-span-2"
        >
          <Input size="large" placeholder="เช่น Cisco Networking Academy" />
        </Form.Item>
        <Form.Item
          label="คำอธิบายเพิ่มเติม"
          name="description"
          className="col-span-2"
        >
          <TextArea
            rows={4}
            size="large"
            placeholder="ระบุรายละเอียดเพิ่มเติมเกี่ยวกับคุณวุฒิ เช่น เนื้อหาที่สอบ ความสำคัญ..."
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

export default CreateCertificateForm;
