import { useForm } from "antd/es/form/Form";
import Button from "../../../../components/button/button";
import LearningActivityDetailForm from "./learning-activity-detail-form";
import PageLayout from "../../../../components/container/page-layout";
import type { CreateLearningActivityFormType } from "../types/learning-activity-type.type";
import { useDispatch, useSelector } from "react-redux";
import { generatePath, useNavigate, useParams } from "react-router-dom";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import {
  postLearningActivity,
  putLearningActivity,
} from "../stores/teacher-learning-activity-action";
import { message } from "antd";
import { paths } from "../../../../routes/paths.config";
import {
  appendAttachments,
  appendPrimitive,
} from "../../../../utils/append-form-data";
import { scrollToErrorField } from "../../../../utils/handle-form-status";
import type { GetLearningActivityDetailResp } from "../../../../types/activity-type.type";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

type Props = {
  edit?: boolean;
  activityDetail?: GetLearningActivityDetailResp;
};

const CreateLearningActivitySection = (props: Props) => {
  const navigate = useNavigate();
  const { secId } = useParams();

  const [messageApi, contextHolder] = message.useMessage();

  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.teacherHome);
  const learningActivitySlice = useSelector(
    (state: RootState) => state.teacherLearningActivity,
  );

  const [learningActivityForm] = useForm<CreateLearningActivityFormType>();

  const [removeFile, setRemoveFile] = useState<number[]>([]);

  const handleOnSubmit = async () => {
    try {
      if (!homeSlice.selectedCourse) return;

      const learningActivityValues =
        await learningActivityForm.validateFields();

      const formData = formatFormData(learningActivityValues);

      const resp = await dispatch(postLearningActivity(formData)).unwrap();

      if (resp.success) {
        messageApi.success("สร้างกิจกรรมการประเมินใหม่สำเร็จ");
        setTimeout(() => {
          const path = generatePath(
            paths.teacher.course.learningActivity.list,
            {
              secId: secId,
            },
          );
          navigate(path);
        }, 500);
      }
    } catch (error: any) {
      scrollToErrorField(learningActivityForm, error);
    }
  };

  const handleOnSubmitEditForm = async () => {
    try {
      if (!homeSlice.selectedCourse) return;

      const learningActivityValues =
        await learningActivityForm.validateFields();

      const formData = formatEditFormData(learningActivityValues);

      const resp = await dispatch(putLearningActivity(formData)).unwrap();

      if (resp.success) {
        messageApi.success("แก้ไขกิจกรรมการประเมินใหม่สำเร็จ");
        setTimeout(() => {
          const path = generatePath(
            paths.teacher.course.learningActivity.list,
            {
              secId: secId,
            },
          );
          navigate(path);
        }, 500);
      }
    } catch (error: any) {
      scrollToErrorField(learningActivityForm, error);
    }
  };

  const formatFormData = (
    learningActivityValues: CreateLearningActivityFormType,
  ) => {
    const formData = new FormData();

    if (!homeSlice.selectedCourse) return formData;

    for (const [key, value] of Object.entries(learningActivityValues)) {
      if (value === null || value === undefined) continue;

      if (key === "attachments") {
        appendAttachments(formData, learningActivityValues.attachments);
      } else {
        appendPrimitive(formData, key, value);
      }
    }

    formData.append(
      "section_id",
      JSON.stringify(homeSlice.selectedCourse.section_id),
    );

    return formData;
  };

  const formatEditFormData = (
    learningActivityValues: CreateLearningActivityFormType,
  ) => {
    const formData = new FormData();

    if (!homeSlice.selectedCourse) return formData;

    for (const [key, value] of Object.entries(learningActivityValues)) {
      if (value === null || value === undefined) continue;

      if (key === "attachments") {
        appendAttachments(formData, learningActivityValues.attachments);
      } else {
        appendPrimitive(formData, key, value);
      }
    }

    formData.append(
      "section_id",
      JSON.stringify(homeSlice.selectedCourse.section_id),
    );

    formData.append("remove_attachment_ids", JSON.stringify(removeFile));
    formData.append(
      "learning_activity_id",
      JSON.stringify(props.activityDetail?.learning_activity_id),
    );

    return formData;
  };

  const handleInitEditForm = () => {
    if (!props.activityDetail) return;

    learningActivityForm.setFieldsValue({
      learning_activity_name: props.activityDetail.learning_activity_name,
      learning_activity_type: props.activityDetail.learning_activity_type,
      course_syllabus_id: props.activityDetail.course_syllabus_id ?? undefined,
      announcement_date: props.activityDetail.announcement_date
        ? dayjs(props.activityDetail.announcement_date)
        : undefined,
      deadline_date: props.activityDetail.deadline_date
        ? dayjs(props.activityDetail.deadline_date)
        : undefined,
      detail: props.activityDetail.detail ?? undefined,
    });
  };

  useEffect(() => {
    handleInitEditForm();
  }, [props.activityDetail]);

  return (
    <PageLayout>
      {contextHolder}

      <LearningActivityDetailForm
        learningActivityForm={learningActivityForm}
        setRemoveFile={setRemoveFile}
        activityDetail={props.activityDetail}
        edit={props.edit}
        messageApi={messageApi}
      />

      <div className="flex justify-end">
        {props.edit ? (
          <Button
            className="rounded-4xl py-4"
            iconSrc="/assets/announcement/add-icon.svg"
            onClick={handleOnSubmitEditForm}
            loading={learningActivitySlice.putLearningActivityLoading}
          >
            แก้ไขงาน
          </Button>
        ) : (
          <Button
            className="rounded-4xl py-4"
            iconSrc="/assets/announcement/add-icon.svg"
            onClick={handleOnSubmit}
            loading={learningActivitySlice.postLearningActivityLoading}
          >
            เพิ่มงาน
          </Button>
        )}
      </div>
    </PageLayout>
  );
};

export default CreateLearningActivitySection;
