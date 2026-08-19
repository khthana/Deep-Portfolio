import { generatePath, useParams } from "react-router-dom";
import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import BackButton from "../../../../components/button/back-button";
import { paths } from "../../../../routes/paths.config";
import CreateActivitySection from "../components/create-activity-section";
import PageLayout from "../../../../components/container/page-layout";
import type { AppDispatch } from "../../../../stores/stores";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { fetchActivity } from "../stores/teacher-activity-action";
import type { ActivityDetailResp } from "@deep-portfolio/api-types";

const TeacherEditActivityPage = () => {
  const { secId, activityId } = useParams();
  const path = generatePath(paths.teacher.course.activity.list, {
    secId: secId,
  });

  const dispatch = useDispatch<AppDispatch>();

  const [activityDetail, setActivityDetail] =
    useState<ActivityDetailResp | null>(null);

  const handleFetchData = async () => {
    try {
      if (!activityId) return;
      const { data } = await dispatch(
        fetchActivity(parseInt(activityId)),
      ).unwrap();

      setActivityDetail(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleFetchData();
  }, [activityId]);

  return (
    <PageLayout>
      <TeacherBreadcrumb title="กิจกรรมการประเมิน" />

      <BackButton title="แก้ไขกิจกรรมการประเมิน" href={path} color="blue" />

      {activityDetail && (
        <CreateActivitySection edit activityDetail={activityDetail} />
      )}
    </PageLayout>
  );
};

export default TeacherEditActivityPage;
