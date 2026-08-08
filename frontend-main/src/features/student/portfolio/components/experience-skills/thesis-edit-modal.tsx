import { Form, Input, Modal, message, Upload, Image } from "antd";
import { getFile } from "../../../../../utils/get-file";
import type { UploadFile } from "antd";
import { useEffect, useState } from "react";
import Button from "../../../../../components/button/button";
import TextAreaWithCheckbox from "../text-area-with-checkbox";
import { updatePortfolioThesis } from "../../../../../services/portfolio-thesis.service";
import type {
  PortfolioThesisResp,
  UpdatePortfolioThesisReq,
} from "../../types/portfolio-thesis-type.type";

type ThesisEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  data: PortfolioThesisResp | null;
};

const ThesisEditModal = ({
  isOpen,
  onClose,
  onSuccess,
  data,
}: ThesisEditModalProps) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [idsToDelete, setIdsToDelete] = useState<number[]>([]);

  // Local state for checkboxes
  const [showRolesAndContributions, setShowRolesAndContributions] =
    useState<boolean>(true);
  const [showInitialExpectations, setShowInitialExpectations] =
    useState<boolean>(true);
  const [showReflections, setShowReflections] = useState<boolean>(true);

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    if (isOpen && data) {
      form.setFieldsValue({
        name: data.name,
        repository: data.repository,
        role_and_resp: data.role_and_resp,
        init_expect: data.init_expect,
        reflection: data.reflection,
      });
      setShowRolesAndContributions(data.is_show_role);
      setShowInitialExpectations(data.is_show_init);
      setShowReflections(data.is_show_reflec);

      // Initialize fileList with existing attachments
      const initialFiles: UploadFile[] = data.attachments.map((att) => ({
        uid: String(att.attachment_id),
        name: att.original_filename,
        status: "done",
        url: att.url
          ? att.url.startsWith("http")
            ? att.url
            : getFile(att.url)
          : undefined,
      }));
      setFileList(initialFiles);
      setIdsToDelete([]);
    } else {
      form.resetFields();
      setFileList([]);
    }
  }, [isOpen, data, form]);

  const onFinish = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (!data?.id) return;

      const req: UpdatePortfolioThesisReq = {
        name: values.name,
        repository: values.repository,
        role_and_resp: values.role_and_resp,
        init_expect: values.init_expect,
        reflection: values.reflection,
        is_show_repo: true,
        is_show_role: showRolesAndContributions,
        is_show_init: showInitialExpectations,
        is_show_reflec: showReflections,
        ids_to_delete: idsToDelete,
      };

      const files = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj as File);

      await updatePortfolioThesis(data.id, req, files);

      messageApi.success("แก้ไขข้อมูลวิทยานิพนธ์เรียบร้อยแล้ว");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error.response?.data?.message || "เกิดข้อผิดพลาดในการแก้ไขโครงงาน";
      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (file: UploadFile) => {
    if (file.url) {
      setIdsToDelete((prev) => [...prev, Number(file.uid)]);
    }
    return true;
  };

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
      {contextHolder}
      <Modal
        title={
          <h2 className="body-bold-1 text-primary-orange my-4">แก้ไขโครงงาน</h2>
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
              onClick={onFinish}
              loading={loading}
              className="bg-[#0e305cff] text-white"
            >
              บันทึก
            </Button>
          </div>
        }
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="ชื่อโครงงาน"
            name="name"
            rules={[{ required: true, message: "กรุณากรอกชื่อโครงงาน" }]}
          >
            <Input
              size="large"
              placeholder="เช่น ระบบจัดการคลังสินค้าอัจฉริยะ"
            />
          </Form.Item>

          <Form.Item label="Repository" name="repository">
            <Input
              size="large"
              placeholder="เช่น https://github.com/username/project"
            />
          </Form.Item>

          <TextAreaWithCheckbox
            isShow={showRolesAndContributions}
            setIsShow={setShowRolesAndContributions}
            label="บทบาทและการทำงานในชิ้นงาน"
            name="role_and_resp"
          />
          <TextAreaWithCheckbox
            isShow={showInitialExpectations}
            setIsShow={setShowInitialExpectations}
            label="ความคาดหวังเริ่มแรกเมื่อจะทำชิ้นงาน"
            name="init_expect"
          />
          <TextAreaWithCheckbox
            isShow={showReflections}
            setIsShow={setShowReflections}
            label="สิ่งที่สะท้อนความคิดจากการทำงาน"
            name="reflection"
          />

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

export default ThesisEditModal;
