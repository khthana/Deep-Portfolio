import { generatePath, useParams } from "react-router-dom";
import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import BackButton from "../../../../components/button/back-button";
import { paths } from "../../../../routes/paths.config";
import GradingSection from "../components/grading-section";
import ActivityViewer from "../components/activity-viewer";
import { use, useEffect, useState } from "react";
import PageLayout from "../../../../components/container/page-layout";
import WhiteContainer from "../../../../components/container/white-container";
import type { AppDispatch } from "../../../../stores/stores";
import { useDispatch } from "react-redux";
import {
  fetchStudentActivityDetail,
  patchBookmarkStudentActivity,
} from "../stores/teacher-activity-action";
import type { GetStudentActivityDetailResp } from "../../../../types/student-activity-type.type";
import {
  activityTypeLabel,
  type AddStudentActivityToBookmark,
} from "../types/activity-type.type";

const TeacherGradingPage = () => {
  const { secId, activityId, workId } = useParams();
  const path = generatePath(paths.teacher.course.activity.detail, {
    secId: secId,
    activityId: activityId,
  });

  const dispatch = useDispatch<AppDispatch>();

  const [classworkData, setClassworkData] =
    useState<GetStudentActivityDetailResp>();
  const [fileSrc, setFileSrc] = useState<string | null>(null);
  const [isBookmark, setIsBookmark] = useState<boolean>(false);

  const handleAddBookmark = async () => {
    try {
      if (!workId || !classworkData) return;

      const data: AddStudentActivityToBookmark = {
        activity_type: classworkData.activity_type,
        is_bookmark: !isBookmark,
        student_activity_id: parseInt(workId),
      };

      const resp = await dispatch(patchBookmarkStudentActivity(data)).unwrap();

      if (resp.success) {
        // handleFetchStudentActivityDetail();
        setIsBookmark(resp.data.is_bookmark);
      }
    } catch (error) {}
  };

  const handlePreviewFile = (src: string) => {
    setFileSrc(src);
  };

  const handleFetchStudentActivityDetail = async () => {
    if (!workId) return;

    const { data } = await dispatch(
      fetchStudentActivityDetail(parseInt(workId)),
    ).unwrap();

    setClassworkData(data);
  };

  useEffect(() => {
    handleFetchStudentActivityDetail();
  }, [workId]);

  useEffect(() => {
    if (classworkData) {
      setIsBookmark(classworkData.is_bookmark);
    }
  }, [classworkData]);

  return (
    <PageLayout>
      <TeacherBreadcrumb title="กิจกรรมการประเมิน" />

      <BackButton
        title={
          classworkData?.activity_name && classworkData?.activity_type
            ? `${classworkData.activity_name} - ${activityTypeLabel[classworkData.activity_type]}`
            : ""
        }
        href={path}
        color="blue"
      />

      {classworkData && (
        <div className="w-full h-full">
          <WhiteContainer>
            <div className="grid grid-cols-5 gap-8 max-h-270">
              <div className="col-span-3 overflow-y-auto max-h-250">
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
                  handleFetchStudentActivityDetail={
                    handleFetchStudentActivityDetail
                  }
                  action
                  color="blue"
                />
              </div>
            </div>
          </WhiteContainer>
        </div>
      )}
    </PageLayout>
  );
};

export default TeacherGradingPage;
