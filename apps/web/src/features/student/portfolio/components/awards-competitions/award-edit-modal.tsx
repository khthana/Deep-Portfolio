import {
  Modal,
  Form,
  Input,
  message,
  Upload,
  Image,
  DatePicker,
  Checkbox,
} from "antd";
import { useEffect, useState } from "react";
import type { UploadFile } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(buddhistEra);
dayjs.locale("th");
import Button from "../../../../../components/button/button";
import {
  createPortfolioAward,
  updatePortfolioAward,
} from "../../../../../services/portfolio-award.service";
import type {
  PortfolioAwardResp,
  CreatePortfolioAwardReq,
  UpdatePortfolioAwardReq,
} from "../../../../../types/portfolio-award-type.type";
import { getFile } from "../../../../../utils/get-file";

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

import type { MessageInstance } from "antd/es/message/interface";

type AwardEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  data: PortfolioAwardResp | null;
  messageApi: MessageInstance;
};

const AwardEditModal = ({
  isOpen,
  onClose,
  onSuccess,
  data,
  messageApi,
}: AwardEditModalProps) => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [idsToDelete, setIdsToDelete] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen && data) {
      form.setFieldsValue({
        award: data.award,
        name: data.name,
        organize: data.organize,
        date: data.date ? dayjs(data.date) : null,
        description: data.description,
        is_show: data.is_show,
      });

      // Handle existing attachments
      if (data.attachments && data.attachments.length > 0) {
        const existingFiles: UploadFile[] = data.attachments.map((att) => ({
          uid: att.attachment_id.toString(),
          name: att.original_filename || "image",
          status: "done",
          url: att.url ? getFile(att.url) : undefined,
        }));
        setFileList(existingFiles);
      } else {
        setFileList([]);
      }
      setIdsToDelete([]);
    } else {
      form.resetFields();
      setFileList([]);
      setIdsToDelete([]);
    }
  }, [isOpen, data, form]);

  const handleRemove = (file: UploadFile) => {
    if (file.url) {
      // It's an existing file
      setIdsToDelete((prev) => [...prev, Number(file.uid)]);
    }
    return true;
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

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

      const userId = studentId;

      const files = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj as File);

      if (data?.id) {
        // Update
        const payload: UpdatePortfolioAwardReq = {
          ...values,
          date: values.date ? values.date.toISOString() : undefined,
          ids_to_delete: idsToDelete,
        };
        await updatePortfolioAward(data.id, payload, files);
      } else {
        // Create
        const payload: CreatePortfolioAwardReq = {
          user_id: userId,
          ...values,
          date: values.date ? values.date.toISOString() : undefined,
        };
        await createPortfolioAward(payload, files);
      }

      messageApi.success("แก้ไขข้อมูลรางวัลและการแข่งขันเรียบร้อยแล้ว");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <>
      <Modal
        title={
          <h2 className="body-bold-1 text-primary-orange my-4">
            {data
              ? "แก้ไขข้อมูลรางวัลและการแข่งขัน"
              : "เพิ่มข้อมูลรางวัลและการแข่งขัน"}
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
            <Form.Item label="วันที่ได้รับรางวัล" name="date">
              <DatePicker
                size="large"
                style={{ width: "100%" }}
                format="DD/MM/BBBB"
                placeholder="เลือกวันที่"
              />
            </Form.Item>
            <Form.Item label="รางวัลที่ได้รับ" name="award">
              <Input size="large" placeholder="เช่น รางวัลชนะเลิศอันดับ 1" />
            </Form.Item>
            <Form.Item
              label="ชื่องาน/การแข่งขัน"
              name="name"
              rules={[
                { required: true, message: "กรุณากรอกชื่องาน/การแข่งขัน" },
              ]}
              className="col-span-2"
            >
              <Input
                size="large"
                placeholder="เช่น การแข่งขันเขียนโปรแกรมระดับประเทศ"
              />
            </Form.Item>
            <Form.Item
              label="หน่วยงานที่จัด"
              name="organize"
              className="col-span-2"
            >
              <Input
                size="large"
                placeholder="เช่น สมาคมคอมพิวเตอร์เเห่งประเทศไทย"
              />
            </Form.Item>
            <Form.Item
              label="คำอธิบายเพิ่มเติม"
              name="description"
              className="col-span-2"
            >
              <Input.TextArea
                rows={4}
                size="large"
                placeholder="ระบุรายละเอียดรางวัล เช่น สิ่งที่ได้รับ ความภาคภูมิใจ..."
              />
            </Form.Item>

            <Form.Item
              label="ไฟล์แนบเพิ่มเติม (รูปภาพ, ใบประกาศ)"
              className="col-span-2"
            >
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
                onRemove={handleRemove}
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

            <Form.Item
              name="is_show"
              valuePropName="checked"
              className="col-span-2"
            >
              <Checkbox>แสดงบนหน้าเว็บผลงาน</Checkbox>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <div style={{ display: "none" }}>
        <Image
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            src: previewImage,
          }}
        />
      </div>
    </>
  );
};

export default AwardEditModal;
