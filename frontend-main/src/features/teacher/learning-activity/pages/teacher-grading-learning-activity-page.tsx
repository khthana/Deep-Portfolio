import { generatePath, useParams } from "react-router-dom";
import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import BackButton from "../../../../components/button/back-button";
import PageLayout from "../../../../components/container/page-layout";
import { paths } from "../../../../routes/paths.config";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStudentLearningActivityDetail,
  patchBookmarkStudentLearningActivity,
} from "../stores/teacher-learning-activity-action";
import type { GetStudentLearningActivityDetailResp } from "../../../../types/student-learning-activity-type.type";
import { useEffect, useState } from "react";
import { activityTypeLabel } from "../../activity/types/activity-type.type";
import WhiteContainer from "../../../../components/container/white-container";
import ActivityViewer from "../../activity/components/activity-viewer";
import GradingSection from "../components/grading-section";
import type { AddStudentLearningActivityToBookmark } from "../types/learning-activity-type.type";

const TeacherGradingLearningActivityPage = () => {
  const { secId, activityId, workId } = useParams();
  const path = generatePath(paths.teacher.course.learningActivity.detail, {
    secId: secId,
    activityId: activityId,
  });

  const dispatch = useDispatch<AppDispatch>();

  const [fileSrc, setFileSrc] = useState<string | null>(null);
  const [isBookmark, setIsBookmark] = useState<boolean>(false);

  const [classworkData, setClassworkData] =
    useState<GetStudentLearningActivityDetailResp>();

  const handleFetchStudentLearningActivityDetail = async () => {
    if (!workId) return;

    const { data } = await dispatch(
      fetchStudentLearningActivityDetail(parseInt(workId)),
    ).unwrap();

    setClassworkData(data);
  };

  const handleAddBookmark = async () => {
    try {
      if (!workId || !classworkData) return;

      const data: AddStudentLearningActivityToBookmark = {
        activity_type: classworkData.learning_activity_type,
        is_bookmark: !isBookmark,
        student_learning_activity_id: parseInt(workId),
      };

      const resp = await dispatch(
        patchBookmarkStudentLearningActivity(data),
      ).unwrap();

      if (resp.success) {
        // handleFetchStudentActivityDetail();
        setIsBookmark(resp.data.is_bookmark);
      }
    } catch (error) {}
  };

  const handlePreviewFile = (src: string) => {
    setFileSrc(src);
  };

  useEffect(() => {
    handleFetchStudentLearningActivityDetail();
  }, [workId]);

  useEffect(() => {
    if (classworkData) {
      setIsBookmark(classworkData.is_bookmark);
    }
  }, [classworkData]);

  return (
    <PageLayout>
      <TeacherBreadcrumb title="กิจกรรมการเรียนรู้" />

      <BackButton
        title={
          classworkData?.learning_activity_name &&
          classworkData?.learning_activity_type
            ? `${classworkData.learning_activity_name} - ${activityTypeLabel[classworkData.learning_activity_type]}`
            : ""
        }
        href={path}
        color="blue"
      />

      {classworkData && (
        <WhiteContainer>
          <div className="grid grid-cols-5 gap-8 max-h-250">
            <div className="col-span-3 overflow-y-auto max-h-200">
              {fileSrc && (
                <ActivityViewer
                  src={fileSrc}
                  isBookmark={isBookmark}
                  handleAddBookmark={handleAddBookmark}
                />
              )}
            </div>

            <div className="col-span-2 h-fit">
              <GradingSection
                handlePreviewFile={handlePreviewFile}
                classworkData={classworkData}
                handleFetchStudentLearningActivityDetail={
                  handleFetchStudentLearningActivityDetail
                }
                action
                color="blue"
              />
            </div>
          </div>
        </WhiteContainer>
      )}
    </PageLayout>
  );
};

export default TeacherGradingLearningActivityPage;
