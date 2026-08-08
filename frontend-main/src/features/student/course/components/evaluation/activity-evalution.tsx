import { generatePath, useParams } from "react-router-dom";
import TeacherBreadcrumb from "../../../../../components/breadcrumb/teacher-breadcrumb";
import BackButton from "../../../../../components/button/back-button";
import { paths } from "../../../../../routes/paths.config";
import { use, useEffect, useState } from "react";
import PageLayout from "../../../../../components/container/page-layout";
import WhiteContainer from "../../../../../components/container/white-container";
import type { AppDispatch } from "../../../../../stores/stores";
import { useDispatch } from "react-redux";
import type { GetStudentActivityDetailResp } from "../../../../../types/student-activity-type.type";
import { fetchStudentActivityDetail } from "../../../../teacher/activity/stores/teacher-activity-action";
import { activityTypeLabel } from "../../../../teacher/activity/types/activity-type.type";
import ActivityViewer from "../../../../teacher/activity/components/activity-viewer";
import GradingSection from "../../../../teacher/activity/components/grading-section";
import { Breadcrumb } from "antd";

const ActivityEvaluation = () => {
  const { secId, activityId } = useParams();
  const path = generatePath(paths.student.course.evaluation.list, {
    secId: secId,
  });

  const dispatch = useDispatch<AppDispatch>();

  const [classworkData, setClassworkData] =
    useState<GetStudentActivityDetailResp>();
  const [fileSrc, setFileSrc] = useState<string | null>(null);
  const [isBookmark, setIsBookmark] = useState<boolean>(false);

  // const handleAddBookmark = async () => {
  //   try {
  //     if (!workId || !classworkData) return;

  //     const data: AddStudentActivityToBookmark = {
  //       activity_type: classworkData.activity_type,
  //       is_bookmark: !isBookmark,
  //       student_activity_id: parseInt(workId),
  //     };

  //     const resp = await dispatch(patchBookmarkStudentActivity(data)).unwrap();

  //     if (resp.success) {
  //       // handleFetchStudentActivityDetail();
  //       setIsBookmark(resp.data.is_bookmark);
  //     }
  //   } catch (error) {}
  // };

  const handlePreviewFile = (src: string) => {
    setFileSrc(src);
  };

  const handleFetchStudentActivityDetail = async () => {
    if (!activityId) return;

    const { data } = await dispatch(
      fetchStudentActivityDetail(parseInt(activityId)),
    ).unwrap();

    setClassworkData(data);
  };

  useEffect(() => {
    handleFetchStudentActivityDetail();
  }, [activityId]);

  //   useEffect(() => {
  //     if (classworkData) {
  //       setIsBookmark(classworkData.is_bookmark);
  //     }
  //   }, [classworkData]);

  return (
    <PageLayout>
      <Breadcrumb
        className="breadcrumb-bold"
        separator=">"
        items={[
          {
            title: "USER EXPERIENCE AND USER INTERFACE DESIGN",
          },
          {
            title: "ผลการประเมิน",
          },
        ]}
      />

      <BackButton
        title={
          classworkData?.activity_name && classworkData?.activity_type
            ? `${classworkData.activity_name} - ${activityTypeLabel[classworkData.activity_type]}`
            : ""
        }
        href={path}
        color="orange"
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
                    // handleAddBookmark={handleAddBookmark}
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
                />
              </div>
            </div>
          </WhiteContainer>
        </div>
      )}
    </PageLayout>
  );
};

export default ActivityEvaluation;
