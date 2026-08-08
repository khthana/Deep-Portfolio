import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Upload,
} from "antd";
import { useForm, type FormInstance } from "antd/es/form/Form";
import TextEditor from "../../../../components/input/text-editor";
import Button from "../../../../components/button/button";
import UploadButton from "../../../../components/input/upload-button";
import {
  AttachmentType,
  type AttachmentDetailItem,
} from "../../announcement/types/announement-type";
import WhiteContainer from "../../../../components/container/white-container";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useEffect, useState } from "react";
import type { CreateLearningActivityFormType } from "../types/learning-activity-type.type";
import type { Options } from "../../../../types/global-type";
import { fetchLessonPlanOptions } from "../../lesson-plan/stores/teacher-lesson-plan-action";
import type { JSONContent } from "@tiptap/react";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import { activityTypeOptions } from "../../activity/types/activity-type.type";
import PreviewListFile from "../../announcement/components/preview-list-file";
import UploadLinkForm from "../../announcement/components/upload-link-form";
import type { UploadChangeParam, UploadFile } from "antd/es/upload";
import type { GetLearningActivityDetailResp } from "../../../../types/activity-type.type";
import type {
  FileDetail,
  URLDetail,
} from "../../../../types/attachment-type.type";
import FileWithRemoveButton from "../../activity/components/file-with-remove-button";
import UrlWithRemoveButton from "../../activity/components/url-with-remove-button";
import type { MessageInstance } from "antd/es/message/interface";

type Props = {
  learningActivityForm: FormInstance<CreateLearningActivityFormType>;
  messageApi: MessageInstance;

  edit?: boolean;
  setRemoveFile?: React.Dispatch<React.SetStateAction<number[]>>;
  activityDetail?: GetLearningActivityDetailResp;
};

const LearningActivityDetailForm = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.teacherHome);

  // const [messageApi, contextHolder] = message.useMessage();

  const [showUploadLinkForm, setShowUploadLinkForm] = useState(false);
  const [previewAllFiles, setPreviewAllFiles] = useState<
    AttachmentDetailItem[]
  >([]);
  const [lessonPlanOptions, setLessonPlanOptions] = useState<Options[]>([]);
  const [oldFiles, setOldFiles] = useState<FileDetail[]>([]);
  const [oldUrls, setOldUrls] = useState<URLDetail[]>([]);

  const announcementDate = Form.useWatch(
    "announcement_date",
    props.learningActivityForm,
  );

  const handleFetchLessonPlanOptions = async () => {
    if (!homeSlice.selectedCourse) return;

    const { data } = await dispatch(
      fetchLessonPlanOptions(homeSlice.selectedCourse.section_id),
    ).unwrap();

    setLessonPlanOptions(data);
  };

  const handleDetailOnChange = (value: JSONContent | null) => {
    props.learningActivityForm.setFieldValue("detail", value);
  };

  const disabledDate: RangePickerProps["disabledDate"] = (current) => {
    return current && current < dayjs().endOf("day").subtract(1, "day");
  };

  const disabledDeadlineDate: RangePickerProps["disabledDate"] = (current) => {
    if (!announcementDate) {
      return false;
    }

    return current && current < dayjs(announcementDate).endOf("day");
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

    props.messageApi.success("เพิ่มไฟล์สำเร็จ");
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
      props.messageApi.error("ขนาดไฟล์ต้องไม่เกิน 10MB");

      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleOnRemove = (item: AttachmentDetailItem) => {
    const newList = previewAllFiles.filter((prev) => prev !== item);

    setPreviewAllFiles(newList);
  };

  useEffect(() => {
    props.learningActivityForm.setFieldsValue({ attachments: previewAllFiles });
  }, [previewAllFiles]);

  useEffect(() => {
    handleFetchLessonPlanOptions();
  }, [homeSlice.selectedCourse]);

  useEffect(() => {
    if (
      props.edit &&
      props.activityDetail &&
      props.activityDetail.attachments &&
      props.activityDetail.attachments.file.length > 0
    ) {
      setOldFiles(props.activityDetail.attachments.file);
    }
    if (
      props.edit &&
      props.activityDetail &&
      props.activityDetail.attachments &&
      props.activityDetail.attachments.url.length > 0
    ) {
      setOldUrls(props.activityDetail.attachments.url);
    }
  }, [props.activityDetail, props.edit]);

  return (
    <WhiteContainer>
      <div className="body-bold-1 pb-5 border-b border-light-grey">
        รายละเอียดงาน
      </div>

      <Form
        form={props.learningActivityForm}
        layout="vertical"
        scrollToFirstError={{ behavior: "instant", block: "end", focus: true }}
      >
        <div className="grid grid-cols-3 2xl:gap-8 gap-4">
          <Form.Item
            label="วันประกาศ"
            name="announcement_date"
            rules={[{ required: true, message: "กรุณาเลือกวันประกาศงาน" }]}
          >
            <DatePicker
              className="w-full"
              size="large"
              showTime
              format="YYYY-MM-DD HH:mm"
              // disabledTime={disabledDateTime}
              disabledDate={disabledDate}
            />
          </Form.Item>

          <Form.Item
            label="วันกำหนดส่ง"
            name="deadline_date"
            dependencies={["announcement_date"]}
            rules={[{ required: true, message: "กรุณาเลือกวันกำหนดส่งงาน" }]}
          >
            <DatePicker
              disabled={announcementDate ? false : true}
              className="w-full"
              size="large"
              showTime={{
                defaultValue: dayjs("23:59", "HH:mm"),
              }}
              format="YYYY-MM-DD HH:mm"
              // disabledTime={disabledDateTime}
              disabledDate={disabledDeadlineDate}
            />
          </Form.Item>

          <Form.Item
            label="สัปดาห์ที่"
            name="course_syllabus_id"
            rules={[
              {
                required: true,
                message: "กรุณาเลือกสัปดาห์หรือแผนการสอน",
              },
            ]}
          >
            <Select size="large" options={lessonPlanOptions} />
          </Form.Item>
        </div>

        <div className="grid grid-cols-5 2xl:gap-8 gap-4">
          <Form.Item
            label="หัวข้อ"
            name="learning_activity_name"
            className="col-span-4"
            rules={[
              { required: true, message: "กรุณากรอกหัวข้องาน" },
              { max: 255, message: "หัวข้อยาวเกิน 255 ตัวอักษร" },
            ]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            label="งานกลุ่ม/เดี่ยว"
            name="learning_activity_type"
            rules={[{ required: true, message: "กรุณาเลือกประเภทงาน" }]}
          >
            <Select size="large" options={activityTypeOptions} />
          </Form.Item>
        </div>

        <Form.Item label="รายละเอียด" name="detail">
          <TextEditor handleOnChange={handleDetailOnChange} />
        </Form.Item>

        <div>
          <div className="flex gap-6">
            <Button
              variant="secondary"
              iconSrc="/assets/announcement/add-link-icon.svg"
              type="button"
              className="h-fit rounded-4xl"
              onClick={() => setShowUploadLinkForm((prev) => !prev)}
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
              color="blue"
              //   loading={
              //     announcementSlice.postAnnouncementLoading ||
              //     announcementSlice.postFileLoading ||
              //     announcementSlice.postURLLoading
              //   }
            />
            <UploadButton
              label="เพิ่มรูปภาพ"
              iconSrc="/assets/announcement/add-image-icon.svg"
              accept=".png,.jpg,.jpeg"
              name="attachments"
              onUpload={handleOnUpload}
              beforeUpload={handleBeforeUpload}
              attachmentType={AttachmentType.IMAGE}
              color="blue"
              //   loading={
              //     announcementSlice.postAnnouncementLoading ||
              //     announcementSlice.postFileLoading ||
              //     announcementSlice.postURLLoading
              //   }
            />
          </div>

          {showUploadLinkForm && (
            <UploadLinkForm handleOnUpload={handleOnUploadUrl} />
          )}

          {oldFiles.map((file, index) => (
            <FileWithRemoveButton
              setRemoveFile={props.setRemoveFile}
              setOldFiles={setOldFiles}
              fileDetail={file}
              key={index}
            />
          ))}
          {oldUrls.map((url, index) => (
            <UrlWithRemoveButton
              urlDetail={url}
              setOldUrls={setOldUrls}
              setRemoveFile={props.setRemoveFile}
              key={index}
            />
          ))}

          <PreviewListFile
            attachmentItems={previewAllFiles}
            handleOnRemove={handleOnRemove}
          />
        </div>
      </Form>
    </WhiteContainer>
  );
};

export default LearningActivityDetailForm;
