import { Form, Input, message, Upload, type UploadFile } from "antd";
import TextEditor from "../../../../components/input/text-editor";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import {
  AttachmentType,
  type AnnouncmentFormType,
  type AttachmentDetailItem,
} from "../types/announement-type";
import Button from "../../../../components/button/button";
import UploadButton from "../../../../components/input/upload-button";
import PreviewListFile from "./preview-list-file";
import type { UploadChangeParam } from "antd/es/upload";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { generatePath, useNavigate, useParams } from "react-router-dom";
import { paths } from "../../../../routes/paths.config";
import { postAnnouncement } from "../stores/announcement-action";
import UploadLinkForm from "./upload-link-form";
import CheckboxWithLabel from "../../../../components/input/checkbox-with-label";
import WhiteContainer from "../../../../components/container/white-container";
import { appendAttachments } from "../../../../utils/append-form-data";

const CreateAnnouncementSection = () => {
  const navigate = useNavigate();
  const { secId } = useParams();

  const dispatch = useDispatch<AppDispatch>();
  const announcementSlice = useSelector(
    (state: RootState) => state.teacherAnnouncement,
  );
  const homeSlice = useSelector((state: RootState) => state.teacherHome);

  const [messageApi, contextHolder] = message.useMessage();

  const [announcementForm] = useForm<AnnouncmentFormType>();

  const [allSection, setAllSection] = useState(false);
  const [showUploadLinkForm, setShowUploadLinkForm] = useState(false);
  const [previewAllFiles, setPreviewAllFiles] = useState<
    AttachmentDetailItem[]
  >([]);

  const handleFinish = async (values: AnnouncmentFormType) => {
    try {
      if (!homeSlice.selectedCourse) return;

      const formData = formatFormData(values);

      const resp = await dispatch(postAnnouncement(formData)).unwrap();

      if (resp.success) {
        messageApi.success("สร้างประกาศใหม่สำเร็จ");
        setTimeout(() => {
          const path = generatePath(paths.teacher.course.announcement.list, {
            secId: secId,
          });
          navigate(path);
        }, 500);
      }
    } catch (error) {
      messageApi.error("ไม่สามารถสร้างประกาศ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const formatFormData = (announcementValues: AnnouncmentFormType) => {
    const formData = new FormData();

    if (!homeSlice.selectedCourse) return formData;

    formData.append("title", announcementValues.title);
    formData.append("content", JSON.stringify(announcementValues.detail));
    formData.append("created_by", homeSlice.selectedCourse.teacher_id);
    formData.append("all_section", JSON.stringify(allSection));
    formData.append(
      "section_id",
      JSON.stringify(homeSlice.selectedCourse.section_id),
    );

    appendAttachments(formData, announcementValues.attachments);

    return formData;
  };

  const handleOnChange = (value: JSONContent | null) => {
    announcementForm.setFieldValue("detail", value);
  };

  const handleCheckboxOnClick = () => {
    setAllSection((prev) => !prev);
  };

  const handleOnUpload = (
    info: UploadChangeParam<UploadFile>,
    type: AttachmentType,
  ) => {
    const { file } = info;
    // ป้องกันการเรียกใช้ function 2 รอบ
    if (file.status !== "done" || type === AttachmentType.LINK) return;

    setPreviewAllFiles((prev: AttachmentDetailItem[]) => {
      return [
        ...prev,
        {
          attachmentType: type,
          attachmentItems: info.file,
        },
      ];
    });

    messageApi.success("เพิ่มไฟล์สำเร็จ");
  };

  const handleOnUploadUrl = (title: string, url: string) => {
    setPreviewAllFiles((prev: AttachmentDetailItem[]) => {
      const linkItem = {
        title: title,
        url: url,
      };

      return [
        ...prev,
        {
          attachmentType: "LINK",
          attachmentItems: linkItem,
        },
      ];
    });

    setShowUploadLinkForm(false);
  };

  const handleBeforeUpload = (file: File) => {
    const isLt10M = file.size / 1024 / 1024 < 10;

    if (!isLt10M) {
      messageApi.error("ขนาดไฟล์ต้องไม่เกิน 10MB");

      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleOnRemove = (item: AttachmentDetailItem) => {
    const newList = previewAllFiles.filter((prev) => prev !== item);

    setPreviewAllFiles(newList);
  };

  useEffect(() => {
    announcementForm.setFieldsValue({ attachments: previewAllFiles });
  }, [previewAllFiles]);

  return (
    <WhiteContainer>
      {contextHolder}

      <Form
        form={announcementForm}
        onFinish={handleFinish}
        layout="vertical"
        // requiredMark={false}
      >
        <Form.Item
          label="หัวข้อ"
          name="title"
          rules={[{ required: true, message: "กรุณากรอกหัวข้อ" }]}
        >
          <Input size="large" />
        </Form.Item>

        <Form.Item
          label="รายละเอียด"
          name="detail"
          rules={[{ required: true, message: "กรุณากรอกรายละเอียด" }]}
        >
          <TextEditor
            handleOnChange={handleOnChange}
            error={
              announcementForm.getFieldError("detail").length !== 0
                ? true
                : false
            }
          />
        </Form.Item>

        <div className="mb-4">
          <CheckboxWithLabel
            label="เพิ่มประกาศในทุกกลุ่มเรียน"
            color="black"
            onChange={handleCheckboxOnClick}
            checked={allSection}
          />
        </div>

        <div>
          <div className="flex gap-6">
            <Button
              variant="secondary"
              iconSrc="/assets/announcement/add-link-icon.svg"
              type="button"
              className="h-fit rounded-4xl"
              onClick={() => setShowUploadLinkForm((prev) => !prev)}
              loading={
                announcementSlice.postAnnouncementLoading ||
                announcementSlice.postFileLoading ||
                announcementSlice.postURLLoading
              }
              color="blue"
            >
              เพิ่มลิงก์
            </Button>

            <UploadButton
              label="เพิ่มไฟล์"
              iconSrc="/assets/announcement/add-file-icon.svg"
              accept=".pdf,.docx,.doc,.txt,.xls,.xlsx,.ods,.ppt,.pptx,.csv,.zip"
              name="attachments"
              onUpload={handleOnUpload}
              beforeUpload={handleBeforeUpload}
              attachmentType={AttachmentType.FILE}
              loading={
                announcementSlice.postAnnouncementLoading ||
                announcementSlice.postFileLoading ||
                announcementSlice.postURLLoading
              }
              color="blue"
            />
            <UploadButton
              label="เพิ่มรูปภาพ"
              iconSrc="/assets/announcement/add-image-icon.svg"
              accept=".png,.jpg,.jpeg"
              name="attachments"
              onUpload={handleOnUpload}
              beforeUpload={handleBeforeUpload}
              attachmentType={AttachmentType.IMAGE}
              loading={
                announcementSlice.postAnnouncementLoading ||
                announcementSlice.postFileLoading ||
                announcementSlice.postURLLoading
              }
              color="blue"
            />
          </div>

          {showUploadLinkForm && (
            <UploadLinkForm handleOnUpload={handleOnUploadUrl} />
          )}

          <PreviewListFile
            attachmentItems={previewAllFiles}
            handleOnRemove={handleOnRemove}
          />
        </div>

        <div className="flex justify-end">
          <Button
            className="rounded-4xl py-4"
            iconSrc="/assets/announcement/add-icon.svg"
            loading={
              announcementSlice.postAnnouncementLoading ||
              announcementSlice.postFileLoading ||
              announcementSlice.postURLLoading
            }
          >
            เพิ่มประกาศ
          </Button>
        </div>
      </Form>
    </WhiteContainer>
  );
};

export default CreateAnnouncementSection;
