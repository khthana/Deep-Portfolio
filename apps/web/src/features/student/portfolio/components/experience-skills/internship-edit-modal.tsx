import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Upload,
  Image,
} from "antd";
import { useEffect, useState } from "react";
import type { UploadFile } from "antd";
import Button from "../../../../../components/button/button";
import { updatePortfolioInternship } from "../../../../../services/portfolio-internship.service";
import CountryInput from "../../../../../components/input/country-input";
import ProvinceInput from "../../../../../components/input/province-input";
import type {
  PortfolioInternshipResp,
  UpdatePortfolioInternshipReq,
} from "../../../../../types/portfolio-internship-type.type";
import TextAreaWithCheckbox from "../text-area-with-checkbox";
import {
  programOptions,
  ProgramType,
} from "../../types/experience-skill-type.type";
import type { ProgramTypeValue } from "../../types/experience-skill-type.type";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(buddhistEra);
dayjs.locale("th");
import { getFile } from "../../../../../utils/get-file";

import type { MessageInstance } from "antd/es/message/interface";

type InternshipEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  data: PortfolioInternshipResp | null;
  messageApi: MessageInstance;
};

const InternshipEditModal = ({
  isOpen,
  onClose,
  onSuccess,
  data,
  messageApi,
}: InternshipEditModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [idsToDelete, setIdsToDelete] = useState<number[]>([]);
  const [programType, setProgramType] = useState<ProgramTypeValue>(
    ProgramType.INTERNSHIP,
  );
  const [showResponsibilities, setShowResponsibilities] =
    useState<boolean>(false);
  const [showLearningOutcomes, setShowLearningOutcomes] =
    useState<boolean>(false);
  const [showReflections, setShowReflections] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && data) {
      setProgramType(data.type as ProgramTypeValue);
      setShowResponsibilities(data.is_show_resp || false);
      setShowLearningOutcomes(data.is_show_learning || false);
      setShowReflections(data.is_show_reflec || false);

      let initialPosition = data.title;
      let initialTitle = "";

      if (data.type === "COOP" && data.title && data.title.includes(" - ")) {
        const parts = data.title.split(" - ");
        // Assume format "Position - Title"
        // But title might contain " - ", so prefer first part as position
        initialPosition = parts[0];
        initialTitle = parts.slice(1).join(" - ");
      }

      form.setFieldsValue({
        title: data.title, // Only relevant if COOP
        position: data.position,
        company: data.company,
        country: data.country,
        province: data.province,
        start_date: data.start_date ? dayjs(data.start_date) : null,
        end_date: data.end_date ? dayjs(data.end_date) : null,
        // job_desc: data.job_desc, // Removed
        resp: data.resp,
        learning_out: data.learning_out,
        reflection: data.reflection,
      });

      // Handle existing attachments
      if (data.attachments && data.attachments.length > 0) {
        const existingFiles: UploadFile[] = data.attachments.map((att) => ({
          uid: att.attachment_id.toString(),
          name: att.original_filename || "file",
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
      setProgramType(ProgramType.INTERNSHIP);
      setShowResponsibilities(false);
      setShowLearningOutcomes(false);
      setShowReflections(false);
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

      if (values.start_date) {
        if (values.start_date.isAfter(dayjs())) {
          messageApi.error("วันที่เริ่มไม่สามารถเป็นอนาคตได้");
          return;
        }
        if (values.start_date.year() <= 0) {
          messageApi.error("ปีที่เริ่มต้องมากกว่า 0");
          return;
        }
      }

      if (values.end_date) {
        if (values.end_date.isAfter(dayjs())) {
          messageApi.error("วันที่สิ้นสุดไม่สามารถเป็นอนาคตได้");
          return;
        }
        if (values.end_date.year() <= 0) {
          messageApi.error("ปีที่สิ้นสุดต้องมากกว่า 0");
          return;
        }
      }

      if (
        values.start_date &&
        values.end_date &&
        values.start_date.isAfter(values.end_date)
      ) {
        messageApi.error("วันที่เริ่มไม่สามารถมากกว่าวันที่สิ้นสุดได้");
        return;
      }

      setLoading(true);

      if (!data?.id) return;

      // Combine position and title for COOP if needed, or just save position as title
      // Based on request "show position as header", we prioritize position.
      // We'll store "Position" or "Position - Title"
      let finalTitle = values.position;
      if (programType === "COOP" && values.title) {
        finalTitle = `${values.position} - ${values.title}`;
      }

      const payload: UpdatePortfolioInternshipReq = {
        type: programType,
        company: values.company,
        country: values.country,
        province: values.province,
        start_date: values.start_date?.toISOString(),
        end_date: values.end_date?.toISOString(),
        position: values.position,
        // job_desc: values.job_desc, // Removed
        resp: values.resp,
        is_show_resp: showResponsibilities,
        learning_out: values.learning_out,
        is_show_learning: showLearningOutcomes,
        reflection: values.reflection,
        is_show_reflec: showReflections,
        title: programType === "COOP" ? values.title : undefined,
        ids_to_delete: idsToDelete,
      };

      const files = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj as File);

      await updatePortfolioInternship(data.id, payload, files);

      messageApi.success("แก้ไขข้อมูลประวัติการฝึกงานเรียบร้อยแล้ว");
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
            แก้ไขข้อมูลการฝึกงาน/สหกิจศึกษา
          </h2>
        }
        open={isOpen}
        onCancel={onClose}
        width={900}
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
          <div className="flex gap-4 mb-4">
            <Form.Item label="ประเภท" className="w-75">
              <Select
                options={programOptions}
                size="large"
                value={programType}
                onChange={(value: ProgramTypeValue) => setProgramType(value)}
              />
            </Form.Item>
            <Form.Item label="ตำแหน่ง" name="position" className="w-full">
              <Input size="large" placeholder="เช่น Software Engineer Intern" />
            </Form.Item>
            {programType === "COOP" && (
              <Form.Item label="หัวข้อ" name="title" className="w-full">
                <Input
                  size="large"
                  placeholder="เช่น โครงการพัฒนาแอพพลิเคชัน"
                />
              </Form.Item>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <Form.Item
              label="หน่วยงาน/บริษัท"
              name="company"
              className="flex-1"
            >
              <Input size="large" placeholder="เช่น Google Thailand" />
            </Form.Item>
            <Form.Item label="ประเทศ" name="country">
              <CountryInput size="large" />
            </Form.Item>
            <Form.Item label="จังหวัด" name="province">
              <ProvinceInput size="large" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Form.Item label="วันที่เริ่ม" name="start_date">
              <DatePicker
                size="large"
                className="w-full"
                format="DD/MM/BBBB"
                placeholder="เลือกวันที่"
              />
            </Form.Item>
            <Form.Item label="วันที่สิ้นสุด" name="end_date">
              <DatePicker
                size="large"
                className="w-full"
                format="DD/MM/BBBB"
                placeholder="เลือกวันที่"
              />
            </Form.Item>
          </div>

          {/* Removed separate job_desc field */}

          <TextAreaWithCheckbox
            isShow={showResponsibilities}
            setIsShow={setShowResponsibilities}
            label="หน้าที่ความรับผิดชอบ"
            name="resp"
          />
          <TextAreaWithCheckbox
            isShow={showLearningOutcomes}
            setIsShow={setShowLearningOutcomes}
            label="สิ่งที่เรียนรู้จากการทำงาน"
            name="learning_out"
          />
          <TextAreaWithCheckbox
            isShow={showReflections}
            setIsShow={setShowReflections}
            label="สิ่งที่สะท้อนความคิดจากการทำงาน"
            name="reflection"
          />

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

export default InternshipEditModal;
