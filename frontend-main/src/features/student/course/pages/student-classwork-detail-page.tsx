import { generatePath, useParams } from "react-router-dom";
import BackButton from "../../../../components/button/back-button";
import PageLayout from "../../../../components/container/page-layout";
import WhiteContainer from "../../../../components/container/white-container";
import { paths } from "../../../../routes/paths.config";
import RubricTable from "../components/classwork-detail/rubric-table";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStudentActivityDetail,
  fetchLearningActivityDetail,
} from "../stores/course-action";
import { useEffect, useMemo, useState } from "react";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";
import { generateHTML } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import AttachmentFileCard from "../components/attachment-file-card";
import AttachmentLinkCard from "../components/attachment-link-card";
import SubmitClassworkSection from "../components/classwork-detail/submit-classwork-section";

const StudentClassworkDetailPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const courseSlice = useSelector((state: RootState) => state.studentCourse);

  const classworkDetail = useMemo(() => {
    return courseSlice.classworkDetail;
  }, [courseSlice.classworkDetail]);

  const { secId, category, activityId } = useParams<{
    secId: string;
    category: string;
    activityId: string;
  }>();

  const path = generatePath(paths.student.course.classwork.list, {
    secId,
  });

  // const [classworkDetail, setClassworkDetail] =
  //   useState<ClassworkDetailFull | null>(null);

  const htmlContent = useMemo(() => {
    const content = classworkDetail?.detail;

    if (!content) return "";

    try {
      return generateHTML(content, [StarterKit]);
    } catch (error) {
      console.error("Error generating HTML from Tiptap JSON:", error);
      return typeof content === "string" ? content : "";
    }
  }, [classworkDetail]);

  const handleFetchData = async () => {
    if (category === "learning_activity") {
      await handleFetchLearningActivityDetail();
    } else {
      await handleFetchActivityDetail();
    }
  };

  const handleFetchActivityDetail = async () => {
    if (!activityId) return;

    const { data } = await dispatch(
      fetchStudentActivityDetail(parseInt(activityId)),
    ).unwrap();

    // setClassworkDetail(mapActivityDetail(data));
  };

  const handleFetchLearningActivityDetail = async () => {
    if (!activityId) return;

    const { data } = await dispatch(
      fetchLearningActivityDetail(parseInt(activityId)),
    ).unwrap();

    // setClassworkDetail(mapLearningActivityDetail(data));
  };

  useEffect(() => {
    handleFetchData();
  }, [activityId]);

  return (
    <PageLayout>
      <BackButton href={path} title="รายละเอียดงาน" color="orange" />

      {classworkDetail && (
        <>
          <div className="w-full grid grid-cols-4 2xl:gap-8 gap-2">
            {/* left section */}
            <div className="col-span-3">
              <WhiteContainer>
                <div className="flex flex-col 2xl:gap-2 pb-5 border-b border-light-grey">
                  <div className="flex justify-between">
                    <div className="body-bold-1">{classworkDetail.name}</div>
                    <div className="caption-bold text-secondary-blue">
                      {classworkDetail.score && classworkDetail.student_score
                        ? `${classworkDetail.student_score}/${classworkDetail.score} คะแนน`
                        : classworkDetail.score
                          ? `${classworkDetail.score} คะแนน`
                          : "ไม่มีคะแนน"}
                    </div>
                  </div>

                  <div>
                    กำหนดส่ง:{" "}
                    {convertDateToThaiFormat(classworkDetail.deadline_date)}
                  </div>
                </div>

                {classworkDetail?.detail && (
                  <div
                    className="caption-regular truncate"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                )}

                <div className="flex gap-2 flex-wrap">
                  {classworkDetail.attachments &&
                    classworkDetail.attachments.file.map((file) => (
                      <AttachmentFileCard
                        key={file.attachment_id}
                        fileDetail={file}
                      />
                    ))}

                  {classworkDetail.attachments &&
                    classworkDetail.attachments.url.map((url) => (
                      <AttachmentLinkCard
                        key={url.attachment_id}
                        linkDetail={url}
                      />
                    ))}
                </div>
              </WhiteContainer>
            </div>

            {/* right section */}
            <SubmitClassworkSection
              // classworkDetail={classworkDetail}
              handleFetchData={handleFetchData}
            />
          </div>

          {classworkDetail.rubrics && classworkDetail.expected_level && (
            <RubricTable
              rubrics={classworkDetail.rubrics}
              expected_level={classworkDetail.expected_level}
            />
          )}
        </>
      )}
    </PageLayout>
  );
};

export default StudentClassworkDetailPage;
