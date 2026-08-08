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
import CheckboxWithLabel from "../../../../components/input/checkbox-with-label";
import Button from "../../../../components/button/button";
import UploadButton from "../../../../components/input/upload-button";
import {
  AttachmentType,
  type AttachmentDetailItem,
} from "../../announcement/types/announement-type";
import { use, useEffect, useState } from "react";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useDispatch, useSelector } from "react-redux";
import { fetchScoreWeightOptions } from "../../course/stores/teacher-course-action";
import type { Options } from "../../../../types/global-type";
import { fetchLessonPlanOptions } from "../../lesson-plan/stores/teacher-lesson-plan-action";
import {
  activityTypeOptions,
  type CreateActivityFormType,
} from "../types/activity-type.type";
import dayjs, { Dayjs } from "dayjs";
import type { RangePickerProps } from "antd/es/date-picker";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { JSONContent } from "@tiptap/react";
import WhiteContainer from "../../../../components/container/white-container";
import type { UploadChangeParam, UploadFile } from "antd/es/upload";
import PreviewListFile from "../../announcement/components/preview-list-file";
import UploadLinkForm from "../../announcement/components/upload-link-form";
import type { GetActivityDetailResp } from "../../../../types/activity-type.type";
import FileWithRemoveButton from "../components/file-with-remove-button";
import UrlWithRemoveButton from "./url-with-remove-button";
import type {
  FileDetail,
  URLDetail,
} from "../../../../types/attachment-type.type";
import type { MessageInstance } from "antd/es/message/interface";

type Props = {
  classworkForm: FormInstance<CreateActivityFormType>;
  // messageApi: MessageInstance;

  edit?: boolean;

  activityDetail?: GetActivityDetailResp;

  setRemoveFile?: React.Dispatch<React.SetStateAction<number[]>>;
};

dayjs.extend(customParseFormat);

const ActivityDetailForm = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.teacherHome);

  const [messageApi, contextHolder] = message.useMessage();

  const [scoreWeightOptions, setScoreWeightOptions] = useState<Options[]>([]);
  const [lessonPlanOptions, setLessonPlanOptions] = useState<Options[]>([]);
  const [showUploadLinkForm, setShowUploadLinkForm] = useState(false);
  const [previewAllFiles, setPreviewAllFiles] = useState<
    AttachmentDetailItem[]
  >([]);
  const [oldFiles, setOldFiles] = useState<FileDetail[]>([]);
  const [oldUrls, setOldUrls] = useState<URLDetail[]>([]);
  const [detailData, setDetailData] = useState<JSONContent | null>(null);

  const announcementDate = Form.useWatch(
    "announcement_date",
    props.classworkForm,
  );

  const handleFetchScoreWeightOptions = async () => {
    if (!homeSlice.selectedCourse) return;

    const { data } = await dispatch(
      fetchScoreWeightOptions(homeSlice.selectedCourse.section_id),
    ).unwrap();

    setScoreWeightOptions(data);
  };

  const handleFetchLessonPlanOptions = async () => {
    if (!homeSlice.selectedCourse) return;

    const { data } = await dispatch(
      fetchLessonPlanOptions(homeSlice.selectedCourse.section_id),
    ).unwrap();

    setLessonPlanOptions(data);
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

  const handleDetailOnChange = (value: JSONContent | null) => {
    props.classworkForm.setFieldValue("detail", value);
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
    props.classworkForm.setFieldsValue({ attachments: previewAllFiles });
  }, [previewAllFiles]);

  useEffect(() => {
    handleFetchScoreWeightOptions();
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

  useEffect(() => {
    const formDetailValue = props.classworkForm.getFieldValue("detail");

    if (formDetailValue) {
      setDetailData(formDetailValue);
    } else if (props.activityDetail?.detail) {
      setDetailData(props.activityDetail.detail);
    }
  }, [props.activityDetail?.detail, props.edit]);

  return (
    <WhiteContainer>
      {contextHolder}

      <div className="body-bold-1 pb-5 border-b border-light-grey">
        รายละเอียดงาน
      </div>

      <Form
        form={props.classworkForm}
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
            name="activity_name"
            className="col-span-2"
            rules={[
              { required: true, message: "กรุณากรอกหัวข้องาน" },
              { max: 255, message: "หัวข้อยาวเกิน 255 ตัวอักษร" },
            ]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            label="คะแนน"
            name="score_number"
            rules={[{ required: true, message: "กรุณากรอกคะแนน" }]}
          >
            <InputNumber style={{ width: "100%" }} size="large" min={0} />
          </Form.Item>

          <Form.Item
            label="งานกลุ่ม/เดี่ยว"
            name="activity_type"
            rules={[{ required: true, message: "กรุณาเลือกประเภทงาน" }]}
          >
            <Select size="large" options={activityTypeOptions} />
          </Form.Item>

          <Form.Item
            label="ประเภทงาน"
            name="score_ratio_id"
            rules={[
              {
                required: true,
                message: "กรุณาเลือกประเภทสัดส่วนคะแนน",
              },
            ]}
          >
            <Select size="large" options={scoreWeightOptions} />
          </Form.Item>
        </div>

        <Form.Item label="รายละเอียด" name="detail">
          <TextEditor
            handleOnChange={handleDetailOnChange}
            value={detailData}
          />
        </Form.Item>

        {/* <div className="flex gap-4">
          <Form.Item
            name="is_average_score"
            valuePropName="checked"
            initialValue={false}
          >
            <CheckboxWithLabel label="เฉลี่ยจากผู้ตรวจทุกคน" color="black" />
          </Form.Item>

          <Form.Item
            name="is_self_assessment"
            valuePropName="checked"
            initialValue={false}
          >
            <CheckboxWithLabel label="นักศึกษาประเมินตนเอง" color="black" />
          </Form.Item>
        </div> */}

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

export default ActivityDetailForm;
