import { DatePicker, Form, Input, Upload, Image, message } from "antd";
import type { UploadFile } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(buddhistEra);
dayjs.locale("th");
import Button from "../../../../../components/button/button";
import { createPortfolioActivity } from "../../../../../services/portfolio-activity.service";
import type { CreatePortfolioActivityReq } from "../../../../../types/portfolio-activity-type.type";
import { paths } from "../../../../../routes/paths.config";
import type { RootState } from "../../../../../stores/stores";

import type { MessageInstance } from "antd/es/message/interface";

type CreateActivityFormProps = {
  messageApi: MessageInstance;
};

const CreateActivityForm = ({ messageApi }: CreateActivityFormProps) => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const onFinish = async (values: {
    name: string;
    date?: dayjs.Dayjs;
    role?: string;
    description?: string;
  }) => {
    if (values.date) {
      if (values.date.isAfter(dayjs())) {
        messageApi.error("วันที่จัดกิจกรรมไม่สามารถเป็นอนาคตได้");
        return;
      }
      if (values.date.year() <= 0) {
        messageApi.error("ปีที่จัดกิจกรรมต้องมากกว่า 0");
        return;
      }
    }

    setLoading(true);
    try {
      const reqData: CreatePortfolioActivityReq = {
        user_id: studentId,
        name: values.name,
        date: values.date ? values.date.toISOString() : undefined,
        role: values.role,
        description: values.description,
        is_show: true,
      };

      const files = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj as File);

      await createPortfolioActivity(reqData, files);
      messageApi.success("เพิ่มข้อมูลกิจกรรมเรียบร้อยแล้ว");
      navigate(paths.student.portfolio.activities.list);
    } catch (error: any) {
      console.error("Error creating activity:", error);
      const errorMessage =
        error.response?.data?.message || "ไม่สามารถเพิ่มกิจกรรมได้";
      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form layout="vertical" form={form} onFinish={onFinish}>
      <div className="grid grid-cols-3 gap-8">
        <Form.Item
          className="col-span-2"
          label="ชื่อกิจกรรม"
          name="name"
          rules={[{ required: true, message: "กรุณากรอกชื่อกิจกรรม" }]}
        >
          <Input size="large" />
        </Form.Item>

        <Form.Item label="วันที่จัดกิจกรรม" name="date">
          <DatePicker
            size="large"
            className="w-full"
            format="DD/MM/BBBB"
            placeholder="เลือกวันที่"
          />
        </Form.Item>
      </div>

      <Form.Item label="หน้าที่ที่ได้รับ" name="role">
        <Input size="large" placeholder="เช่น ผู้ประสานงานโครงการ" />
      </Form.Item>

      <Form.Item label="คำอธิบายเพิ่มเติม" name="description">
        <Input.TextArea
          rows={4}
          size="large"
          placeholder="ระบุรายละเอียดกิจกรรม เช่น หน้าที่ที่ได้รับ ประโยชน์ที่ได้รับ..."
        />
      </Form.Item>

      <Form.Item label="ไฟล์แนบเพิ่มเติม (รูปภาพ, เอกสาร)">
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
        <Button loading={loading}>บันทึก</Button>
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

export default CreateActivityForm;
