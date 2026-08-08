import { Modal, Form, Input, DatePicker, message, Upload, Image } from "antd";
import { useEffect, useState } from "react";
import { upsertPortfolioPersonal } from "../../../../../services/portfolio-personal.service";
import type {
  PortfolioPersonalResp,
  UpsertPortfolioPersonalReq,
} from "../../../../../types/portfolio-personal-type.type";
import type { UserResp } from "../../../../../types/user-type.type";
import dayjs from "dayjs";
import type { UploadFile } from "antd/es/upload/interface";
import Button from "../../../../../components/button/button";
import { getFile } from "../../../../../utils/get-file";
import CountryInput from "../../../../../components/input/country-input";

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

type PersonalDetailsEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: {
    user: UserResp | null;
    portfolioPersonal: PortfolioPersonalResp | null;
  };
};

const PersonalDetailsEditModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: PersonalDetailsEditModalProps) => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const [form] = Form.useForm();
  const [modal, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (isOpen && initialData.user) {
      const { user, portfolioPersonal } = initialData;
      form.setFieldsValue({
        nationality: portfolioPersonal?.nationality,
        race: portfolioPersonal?.race,
        date_of_birth: portfolioPersonal?.date_of_birth
          ? dayjs(portfolioPersonal.date_of_birth)
          : null,
        phone: portfolioPersonal?.phone_number ?? "",
        email: portfolioPersonal?.email ?? "",
        github: portfolioPersonal?.github ?? "",
        linkedin: portfolioPersonal?.linkedin ?? "",
      });

      if (portfolioPersonal?.attachments?.url) {
        setFileList([
          {
            uid: "-1",
            name: "profile.png",
            status: "done",
            url: getFile(portfolioPersonal.attachments.url),
          },
        ]);
      } else {
        setFileList([]);
      }
    }
  }, [isOpen, initialData, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (values.date_of_birth) {
        if (values.date_of_birth.isAfter(dayjs())) {
          messageApi.error("วันเกิดไม่สามารถเป็นอนาคตได้");
          return;
        }
        if (values.date_of_birth.year() <= 0) {
          messageApi.error("ปีที่เกิดต้องมากกว่า 0");
          return;
        }
      }

      setLoading(true);

      const userId = studentId;

      if (!userId) {
        messageApi.error("ไม่พบข้อมูลผู้ใช้");
        return;
      }

      // Prepare data
      const payload: UpsertPortfolioPersonalReq = {
        nationality: values.nationality ?? "",
        race: values.race ?? "",
        date_of_birth: values.date_of_birth
          ? values.date_of_birth.format("YYYY-MM-DD")
          : null,
        phone_number: values.phone ?? "",
        email: values.email ?? "",
        github: values.github ?? "",
        linkedin: values.linkedin ?? "",
        attachment_id:
          fileList.length === 0
            ? null
            : initialData.portfolioPersonal?.attachment_id,
      };

      const file =
        fileList.length > 0 && fileList[0].originFileObj
          ? (fileList[0].originFileObj as File)
          : undefined;

      await upsertPortfolioPersonal(userId, payload, file);

      messageApi.success("แก้ไขข้อมูลส่วนตัวเรียบร้อยแล้ว");
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

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      <div className="text-2xl text-gray-400">+</div>
      <div style={{ marginTop: 8 }}>เลือกไฟล์</div>
    </button>
  );

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
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  return (
    <>
      {modalContextHolder}
      {messageContextHolder}
      <Modal
        title={
          <h2 className="body-bold-1 text-primary-orange mb-6">
            แก้ไขข้อมูลส่วนตัว
          </h2>
        }
        open={isOpen}
        onCancel={onClose}
        width={800}
        style={{ maxWidth: "100%", top: 20 }}
        footer={
          <div className="flex justify-end gap-4 mt-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Section 1: Basic Info */}
            <Form.Item
              label="วันเกิด (ปี ค.ศ.)"
              name="date_of_birth"
              className="col-span-2"
            >
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                placeholder="เลือกวันเกิด"
                disabledDate={(current) =>
                  current && current > dayjs().endOf("day")
                }
              />
            </Form.Item>

            <Form.Item label="สัญชาติ" name="nationality">
              <CountryInput placeholder="เช่น ไทย" />
            </Form.Item>
            <Form.Item label="เชื้อชาติ" name="race">
              <Input placeholder="เช่น ไทย" />
            </Form.Item>

            {/* Section 2: Contact Info */}
            <div className="col-span-2 border-t border-gray-200 my-2"></div>

            <Form.Item label="เบอร์โทรศัพท์" name="phone">
              <Input placeholder="เช่น 081-234-5678" />
            </Form.Item>
            <Form.Item label="อีเมล" name="email">
              <Input placeholder="เช่น name@example.com" />
            </Form.Item>
            <Form.Item label="GitHub" name="github">
              <Input placeholder="เช่น github.com/username" />
            </Form.Item>
            <Form.Item label="LinkedIn" name="linkedin">
              <Input placeholder="เช่น linkedin.com/in/username" />
            </Form.Item>

            {/* Section 3: Image Upload */}
            <div className="col-span-2 border-t border-gray-200 my-2"></div>

            <Form.Item label="รูปโปรไฟล์" className="col-span-2">
              <div className="flex items-start portfolio-upload-circle">
                <Upload
                  accept="image/*"
                  listType="picture-card"
                  fileList={fileList}
                  onChange={({ fileList: newFileList }) =>
                    setFileList(newFileList)
                  }
                  beforeUpload={(file) => {
                    const isImage =
                      file.type.startsWith("image/") ||
                      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);

                    if (!isImage) {
                      modal.error({
                        title: "รูปแบบไฟล์ไม่ถูกต้อง",
                        content:
                          "กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPG, PNG, GIF, etc.)",
                        zIndex: 10001,
                      });
                      return Upload.LIST_IGNORE;
                    }

                    if (file.size > 10 * 1024 * 1024) {
                      messageApi.error("ไฟล์เกินขนาดที่กำหนด");
                      return Upload.LIST_IGNORE;
                    }

                    messageApi.success("เพิ่มไฟล์สำเร็จ");
                    return false;
                  }}
                  maxCount={1}
                  onPreview={handlePreview}
                  showUploadList={{ showPreviewIcon: true }}
                >
                  {fileList.length >= 1 ? null : uploadButton}
                </Upload>
              </div>
              <style>{`
                .portfolio-upload-circle .ant-upload.ant-upload-select-picture-card,
                .portfolio-upload-circle .ant-upload-list-item-container,
                .portfolio-upload-circle .ant-upload-list-item {
                  border-radius: 50% !important;
                  overflow: hidden;
                  aspect-ratio: 1 / 1 !important;
                  height: auto !important;
                }
                .portfolio-upload-circle .ant-upload-list-item.ant-upload-list-item-undefined {
                  border-radius: 50% !important;
                }
                .portfolio-upload-circle .ant-upload-list-item-thumbnail img {
                  object-fit: cover !important;
                  width: 100% !important;
                  height: 100% !important;
                }
              `}</style>
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

export default PersonalDetailsEditModal;
