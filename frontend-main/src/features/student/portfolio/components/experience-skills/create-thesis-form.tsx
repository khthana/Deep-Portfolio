import { Form, Input, message, Upload, Image } from "antd";
import type { UploadFile } from "antd";
import { useState } from "react";
// Removed unused import
import TextAreaWithCheckbox from "../text-area-with-checkbox";
import Button from "../../../../../components/button/button";
import { createPortfolioThesis } from "../../../../../services/portfolio-thesis.service";
import type { CreatePortfolioThesisReq } from "../../types/portfolio-thesis-type.type";
import { useNavigate } from "react-router-dom";

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

const CreateThesisForm = () => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
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

  const [showRolesAndContributions, setShowRolesAndContributions] =
    useState<boolean>(true);
  const [showInitialExpectations, setShowInitialExpectations] =
    useState<boolean>(true);
  const [showReflections, setShowReflections] = useState<boolean>(true);

  const onFinish = async (values: {
    name: string;
    repository?: string;
    role_and_resp?: string;
    init_expect?: string;
    reflection?: string;
  }) => {
    try {
      const req: CreatePortfolioThesisReq = {
        user_id: studentId,
        name: values.name,
        repository: values.repository,
        role_and_resp: values.role_and_resp,
        init_expect: values.init_expect,
        reflection: values.reflection,
        is_show_repo: true,
        is_show_role: showRolesAndContributions,
        is_show_init: showInitialExpectations,
        is_show_reflec: showReflections,
      };

      const files = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj as File);

      const result = await createPortfolioThesis(req, files);
      if (result.success) {
        messageApi.success("เพิ่มข้อมูลวิทยานิพนธ์เรียบร้อยแล้ว");
        navigate(-1);
      } else {
        messageApi.error(result.message || "เกิดข้อผิดพลาด");
      }
    } catch (error: any) {
      console.error("Create Thesis Error:", error);
      console.log("Error Response:", error.response?.data);
      const errorMessage =
        error.response?.data?.message || "เกิดข้อผิดพลาดในการสร้างโครงงาน";
      messageApi.error(errorMessage);
    }
  };

  return (
    <>
      {contextHolder}
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item
          label="ชื่อโครงงาน"
          name="name"
          rules={[{ required: true, message: "กรุณากรอกชื่อโครงงาน" }]}
        >
          <Input size="large" placeholder="เช่น ระบบจัดการคลังสินค้าอัจฉริยะ" />
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

        <Form.Item label="ไฟล์แนบ (รูปภาพ, เอกสาร)">
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
          <Button type="submit">บันทึก</Button>
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

export default CreateThesisForm;
