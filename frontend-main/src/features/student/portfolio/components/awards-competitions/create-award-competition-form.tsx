import {
  DatePicker,
  Form,
  Input,
  message,
  Upload,
  Checkbox,
  Image,
} from "antd";
import { useState } from "react";
import type { UploadFile } from "antd";
import { useNavigate } from "react-router-dom";
import Button from "../../../../../components/button/button";
import { createPortfolioAward } from "../../../../../services/portfolio-award.service";
import type { CreatePortfolioAwardReq } from "../../../../../types/portfolio-award-type.type";
import { paths } from "../../../../../routes/paths.config";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(buddhistEra);
dayjs.locale("th");

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

import type { MessageInstance } from "antd/es/message/interface";

type CreateAwardCompetitionFormProps = {
  messageApi: MessageInstance;
};

const CreateAwardCompetitionForm = ({
  messageApi,
}: CreateAwardCompetitionFormProps) => {
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
    organize?: string;
    award?: string;
    date?: dayjs.Dayjs;
    description?: string;
    is_show?: boolean;
  }) => {
    if (values.date) {
      if (values.date.isAfter(dayjs())) {
        messageApi.error("วันที่ได้รับรางวัลไม่สามารถเป็นอนาคตได้");
        return;
      }
      if (values.date.year() <= 0) {
        messageApi.error("ปีที่ได้รับรางวัลต้องมากกว่า 0");
        return;
      }
    }

    setLoading(true);
    try {
      const reqData: CreatePortfolioAwardReq = {
        user_id: studentId,
        name: values.name,
        organize: values.organize,
        award: values.award,
        date: values.date ? values.date.toISOString() : undefined,
        description: values.description,
        is_show: values.is_show ?? true,
      };

      const files = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj as File);

      await createPortfolioAward(reqData, files);
      messageApi.success("เพิ่มข้อมูลรางวัลและการแข่งขันเรียบร้อยแล้ว");
      navigate(paths.student.portfolio.awardsCompetitions.list);
    } catch (error: any) {
      console.error("Error creating award:", error);
      const errorMessage =
        error.response?.data?.message || "ไม่สามารถสร้างรางวัลได้";
      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form layout="vertical" form={form} onFinish={onFinish}>
      <Form.Item
        label="ชื่องาน/การแข่งขัน"
        name="name"
        rules={[{ required: true, message: "กรุณากรอกชื่องาน/การแข่งขัน" }]}
      >
        <Input
          size="large"
          placeholder="เช่น การแข่งขันเขียนโปรแกรมระดับประเทศ"
        />
      </Form.Item>
      <Form.Item label="หน่วยงานที่จัด" name="organize">
        <Input size="large" placeholder="เช่น สมาคมคอมพิวเตอร์เเห่งประเทศไทย" />
      </Form.Item>

      <div className="grid grid-cols-3 gap-8">
        <Form.Item label="รางวัลที่ได้รับ" name="award" className="col-span-2">
          <Input size="large" placeholder="เช่น รางวัลชนะเลิศอันดับ 1" />
        </Form.Item>
        <Form.Item label="วันที่ได้รางวัล" name="date" className="w-full">
          <DatePicker
            size="large"
            className="w-full"
            format="DD/MM/BBBB"
            placeholder="เลือกวันที่"
          />
        </Form.Item>
      </div>

      <Form.Item label="คำอธิบายเพิ่มเติม" name="description">
        <Input.TextArea
          rows={4}
          size="large"
          placeholder="ระบุรายละเอียดรางวัล เช่น สิ่งที่ได้รับ ความภาคภูมิใจ..."
        />
      </Form.Item>

      <Form.Item label="ไฟล์แนบเพิ่มเติม (รูปภาพ, ใบประกาศ)">
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

      <Form.Item name="is_show" valuePropName="checked" initialValue={true}>
        <Checkbox>แสดงบนหน้าเว็บผลงาน</Checkbox>
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

export default CreateAwardCompetitionForm;
