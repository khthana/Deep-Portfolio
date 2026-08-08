import { generatePath, useParams } from "react-router-dom";
import { paths } from "../../../../routes/paths.config";
import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import BackButton from "../../../../components/button/back-button";
import CreateLearningActivitySection from "../components/create-learning-activity-section";
import PageLayout from "../../../../components/container/page-layout";
import type { AppDispatch } from "../../../../stores/stores";
import { useDispatch } from "react-redux";
import type { GetLearningActivityDetailResp } from "../../../../types/activity-type.type";
import { useEffect, useState } from "react";
import { fetchLearningActivity } from "../stores/teacher-learning-activity-action";

const TeacherEditLearningActivityPage = () => {
  const { secId, activityId } = useParams();
  const path = generatePath(paths.teacher.course.learningActivity.list, {
    secId: secId,
  });

  const dispatch = useDispatch<AppDispatch>();

  const [activityDetail, setActivityDetail] =
    useState<GetLearningActivityDetailResp | null>(null);

  const handleFetchData = async () => {
    try {
      if (!activityId) return;
      const { data } = await dispatch(
        fetchLearningActivity(parseInt(activityId)),
      ).unwrap();

      setActivityDetail(data);
    } catch (error) {}
  };

  useEffect(() => {
    handleFetchData();
  }, [activityId]);

  return (
    <PageLayout>
      <TeacherBreadcrumb title="กิจกรรมการเรียนรู้" />

      <BackButton title="แก้ไขกิจกรรมการเรียนรู้" href={path} color="blue" />

      {activityDetail && (
        <CreateLearningActivitySection edit activityDetail={activityDetail} />
      )}
    </PageLayout>
  );
};

export default TeacherEditLearningActivityPage;
