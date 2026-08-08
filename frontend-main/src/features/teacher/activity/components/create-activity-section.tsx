import { useForm } from "antd/es/form/Form";
import Button from "../../../../components/button/button";
import ActivityDetailForm from "./activity-detail-form";
import RubricForm from "./rubric-form";
import type { CreateActivityFormType } from "../types/activity-type.type";
import { useEffect, useState } from "react";
import SharedRubricModal from "./shared-rubric-modal";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { postActivity, putActivity } from "../stores/teacher-activity-action";
import { message } from "antd";
import { generatePath, useNavigate, useParams } from "react-router-dom";
import { paths } from "../../../../routes/paths.config";
import PageLayout from "../../../../components/container/page-layout";
import type {
  CreateRubricFormType,
  RubricDetailForm,
} from "../types/rubric-type.type";
import { scrollToErrorField } from "../../../../utils/handle-form-status";
import {
  appendAttachments,
  appendPrimitive,
} from "../../../../utils/append-form-data";
import type { GetActivityDetailResp } from "../../../../types/activity-type.type";
import dayjs from "dayjs";

type Props = {
  edit?: boolean;
  activityDetail?: GetActivityDetailResp;
};

const CreateActivitySection = (props: Props) => {
  const navigate = useNavigate();
  const { secId } = useParams();

  const [classworkForm] = useForm<CreateActivityFormType>();
  const [rubricForm] = useForm<CreateRubricFormType>();

  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.teacherHome);
  const activitySlice = useSelector(
    (state: RootState) => state.teacherActivity,
  );

  const [messageApi, contextHolder] = message.useMessage();

  const [openRubricModal, setOpenRubricModal] = useState<boolean>(false);
  const [sharedRubricData, setSharedRubricData] = useState<RubricDetailForm[]>(
    [],
  );
  const [selectedRowKeysByRubric, setSelectedRowKeysByRubric] = useState<
    Record<string, React.Key[]>
  >({});
  const [removeFile, setRemoveFile] = useState<number[]>([]);

  const handleOnSubmit = async () => {
    try {
      if (!homeSlice.selectedCourse) return;

      const classworkValues = await classworkForm.validateFields();
      const rubricValues = await rubricForm.validateFields();

      const formData = formatFormData(classworkValues, rubricValues);

      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }
      const resp = await dispatch(postActivity(formData)).unwrap();

      if (resp.success) {
        messageApi.success("สร้างกิจกรรมการประเมินใหม่สำเร็จ");

        setTimeout(() => {
          const path = generatePath(paths.teacher.course.activity.list, {
            secId: secId,
          });
          navigate(path);
        }, 500);
      }
    } catch (error: any) {
      scrollToErrorField(classworkForm, error);
    }
  };

  const handleOnSubmitEditForm = async () => {
    try {
      if (!homeSlice.selectedCourse) return;

      const classworkValues = await classworkForm.validateFields();
      const rubricValues = await rubricForm.validateFields();

      const formData = formatEditFormData(classworkValues, rubricValues);

      const formObject = Object.fromEntries(formData);
      console.log(formObject);

      // }
      const resp = await dispatch(putActivity(formData)).unwrap();

      if (resp.success) {
        messageApi.success("แก้ไขกิจกรรมการประเมินใหม่สำเร็จ");

        setTimeout(() => {
          const path = generatePath(paths.teacher.course.activity.list, {
            secId: secId,
          });
          navigate(path);
        }, 500);
      }
    } catch (error: any) {
      scrollToErrorField(classworkForm, error);
    }
  };

  const formatFormData = (
    classworkValues: CreateActivityFormType,
    rubricValues: CreateRubricFormType,
  ) => {
    const formData = new FormData();

    if (!homeSlice.selectedCourse) return formData;

    for (const [key, value] of Object.entries(classworkValues)) {
      if (value === null || value === undefined) continue;

      if (key === "attachments") {
        appendAttachments(formData, classworkValues.attachments);
      } else {
        appendPrimitive(formData, key, value);
      }
    }

    formData.append(
      "section_id",
      JSON.stringify(homeSlice.selectedCourse.section_id),
    );
    formData.append(
      "expected_level",
      JSON.stringify(rubricValues.expected_level),
    );

    const cleanedRubrics = rubricValues.rubrics.map((rubric) => ({
      criteria: rubric.criteria,
      weight: rubric.weight,
      levels: rubric.levels,
    }));

    formData.append("rubric", JSON.stringify(cleanedRubrics));

    return formData;
  };

  const formatEditFormData = (
    classworkValues: CreateActivityFormType,
    rubricValues: CreateRubricFormType,
  ) => {
    const formData = new FormData();
    if (!homeSlice.selectedCourse) return formData;

    for (const [key, value] of Object.entries(classworkValues)) {
      if (value === null || value === undefined) continue;

      if (key === "attachments") {
        appendAttachments(formData, classworkValues.attachments);
      } else {
        appendPrimitive(formData, key, value);
      }
    }

    formData.append(
      "section_id",
      JSON.stringify(homeSlice.selectedCourse.section_id),
    );
    formData.append(
      "expected_level",
      JSON.stringify(rubricValues.expected_level),
    );
    formData.append(
      "activity_id",
      JSON.stringify(props.activityDetail?.activity_id),
    );
    formData.append("remove_attachment_ids", JSON.stringify(removeFile));

    const cleanedRubrics = rubricValues.rubrics.map((rubric) => ({
      criteria: rubric.criteria,
      weight: rubric.weight,
      levels: rubric.levels,
    }));

    formData.append("rubric", JSON.stringify(cleanedRubrics));

    return formData;
  };

  const handleDeleteSharedRubric = (index: number) => {
    setSharedRubricData((prevData) => prevData.filter((_, i) => i !== index));
  };

  const handleUncheckSharedRubric = (
    rubricTitleKey: string,
    detailKey: string,
  ) => {
    setSelectedRowKeysByRubric((prev) => {
      const updated = { ...prev };
      if (updated[rubricTitleKey]) {
        updated[rubricTitleKey] = updated[rubricTitleKey].filter(
          (key) => key !== detailKey,
        );
      }
      return updated;
    });
  };

  const handleDeleteRubricFromForm = (
    rubricTitleKey: string,
    detailKey: string,
  ) => {
    const currentRows = rubricForm.getFieldValue("rubrics") || [];

    // ลบ rubric ที่มี key ตรงกัน
    const updatedRows = currentRows.filter(
      (row: any) =>
        !(
          row._shared_rubric_title_key === rubricTitleKey &&
          row._shared_rubric_detail_key === detailKey
        ),
    );

    rubricForm.setFieldsValue({ rubrics: updatedRows });

    // Update sharedRubricData ด้วย
    setSharedRubricData((prevData) =>
      prevData.filter(
        (rubric) =>
          !(
            rubric._shared_rubric_title_key === rubricTitleKey &&
            rubric._shared_rubric_detail_key === detailKey
          ),
      ),
    );
  };

  const handleInitEditForm = () => {
    if (!props.activityDetail) return;

    classworkForm.setFieldsValue({
      activity_name: props.activityDetail.activity_name,
      announcement_date: props.activityDetail.announcement_date
        ? dayjs(props.activityDetail.announcement_date)
        : undefined,
      deadline_date: props.activityDetail.deadline_date
        ? dayjs(props.activityDetail.deadline_date)
        : undefined,
      course_syllabus_id: props.activityDetail.course_syllabus_id ?? undefined,
      score_number: props.activityDetail.score_number ?? undefined,
      activity_type: props.activityDetail.activity_type ?? undefined,
      score_ratio_id: props.activityDetail.score_ratio_id ?? undefined,
      detail: props.activityDetail.detail ?? undefined,
      is_average_score: props.activityDetail.is_average_score ?? undefined,
      is_self_assessment: props.activityDetail.is_self_assessment ?? undefined,
    });

    rubricForm.setFieldValue(
      "expected_level",
      props.activityDetail.expected_level ?? undefined,
    );
  };

  useEffect(() => {
    handleInitEditForm();
  }, [props.activityDetail]);

  return (
    <PageLayout>
      {contextHolder}

      <ActivityDetailForm
        classworkForm={classworkForm}
        edit={props.edit}
        activityDetail={props.activityDetail}
        setRemoveFile={setRemoveFile}
      />
      <RubricForm
        setOpenModal={setOpenRubricModal}
        rubricForm={rubricForm}
        sharedRubricData={sharedRubricData}
        onDeleteSharedRubric={handleDeleteSharedRubric}
        onUncheckSharedRubric={handleUncheckSharedRubric}
        rubricDatail={props.activityDetail?.rubric_activity_mapping}
        edit={props.edit}
      />

      <div className="flex justify-end">
        {props.edit ? (
          <Button
            className="rounded-4xl py-4"
            iconSrc="/assets/announcement/add-icon.svg"
            onClick={handleOnSubmitEditForm}
            loading={activitySlice.putActivityLoading}
          >
            แก้ไขงาน
          </Button>
        ) : (
          <Button
            className="rounded-4xl py-4"
            iconSrc="/assets/announcement/add-icon.svg"
            onClick={handleOnSubmit}
            loading={activitySlice.postActivityLoading}
          >
            เพิ่มงาน
          </Button>
        )}
      </div>

      <SharedRubricModal
        openRubricModal={openRubricModal}
        setOpenRubricModal={setOpenRubricModal}
        setSharedRubricData={setSharedRubricData}
        selectedRowKeysByRubric={selectedRowKeysByRubric}
        setSelectedRowKeysByRubric={setSelectedRowKeysByRubric}
        onDeleteRubricFromForm={handleDeleteRubricFromForm}
      />
    </PageLayout>
  );
};

export default CreateActivitySection;
