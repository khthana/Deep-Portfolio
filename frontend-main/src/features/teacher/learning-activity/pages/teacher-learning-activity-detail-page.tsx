import { useDispatch } from "react-redux";
import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import PageLayout from "../../../../components/container/page-layout";
import WhiteContainer from "../../../../components/container/white-container";
import type { AppDispatch } from "../../../../stores/stores";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchAllSubmittedLearningActivityList } from "../stores/teacher-learning-activity-action";
import type { SubmissionStatus } from "../../activity/types/activity-type.type";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";
import StudentWorkTable from "../components/student-work-table";

export type DataType = {
  key: string;
  no: number;
  submitted_date: string;
  code: string[];
  name: string[];
  status: SubmissionStatus;
  remark: string;
  feedback: string;
  id?: number;
  isNew?: boolean;
};

const TeacherLearningActivityDetailPage = () => {
  const { activityId } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const [data, setData] = useState<DataType[]>([]);
  const [bookmarkData, setBookmarkData] = useState<DataType[]>([]);
  const [activityData, setActivityData] = useState<{
    activity_name: string;
    deadline_date: Date | null;
  }>();

  const handleFetchData = async () => {
    if (!activityId) return;

    const { data } = await dispatch(
      fetchAllSubmittedLearningActivityList(parseInt(activityId)),
    ).unwrap();

    setActivityData({
      activity_name: data.learning_activity_name,
      deadline_date: data.deadline_date,
    });

    const bookmark = data.submissions.filter((item) => item.is_bookmark);

    const mappedData = data.submissions.map((classwork, dataIndex) => {
      const studentCode =
        classwork.submission_type === "GROUP"
          ? classwork.group
            ? classwork.group.members.map((member) => member.student_id)
            : []
          : classwork.student
            ? [classwork.student.student_id]
            : [];

      const studentName =
        classwork.submission_type === "GROUP"
          ? classwork.group
            ? classwork.group.members.map(
                (member) => `${member.first_name_th} ${member.last_name_th}`,
              )
            : []
          : classwork.student
            ? [
                `${classwork.student.first_name_th} ${classwork.student.last_name_th}`,
              ]
            : [];

      return {
        key: classwork.id.toString(),
        no: dataIndex + 1,
        submitted_date: convertDateToThaiFormat(classwork.submitted_at) ?? "-",
        code: studentCode,
        name: studentName,
        status:
          classwork.status === "GRADED"
            ? "GRADED"
            : ("PENDING" as SubmissionStatus),
        remark: classwork.remark ?? "",
        feedback: classwork.feedback ?? "",
        id: classwork.id,
      };
    });

    const mappedBookmarkData = bookmark.map((classwork, dataIndex) => {
      const studentCode =
        classwork.submission_type === "GROUP"
          ? classwork.group
            ? classwork.group.members.map((member) => member.student_id)
            : []
          : classwork.student
            ? [classwork.student.student_id]
            : [];

      const studentName =
        classwork.submission_type === "GROUP"
          ? classwork.group
            ? classwork.group.members.map(
                (member) => `${member.first_name_th} ${member.last_name_th}`,
              )
            : []
          : classwork.student
            ? [
                `${classwork.student.first_name_th} ${classwork.student.last_name_th}`,
              ]
            : [];

      return {
        key: classwork.id.toString(),
        no: dataIndex + 1,
        submitted_date: convertDateToThaiFormat(classwork.submitted_at) ?? "-",
        code: studentCode,
        name: studentName,
        status:
          classwork.status === "GRADED"
            ? "GRADED"
            : ("PENDING" as SubmissionStatus),
        remark: classwork.remark ?? "",
        feedback: classwork.feedback ?? "",
        id: classwork.id,
      };
    });

    setData(mappedData);
    setBookmarkData(mappedBookmarkData);
  };

  useEffect(() => {
    handleFetchData();
  }, [activityId]);

  return (
    <PageLayout>
      <TeacherBreadcrumb
        title="กิจกรรมการเรียนรู้"
        subtitle={activityData?.activity_name}
      />

      <WhiteContainer>
        <div className="pb-5 border-b border-light-grey flex justify-between items-center">
          <div className="body-bold-1">{activityData?.activity_name}</div>
          {activityData?.deadline_date && (
            <div>
              กำหนดส่ง: {convertDateToThaiFormat(activityData.deadline_date)}
            </div>
          )}
        </div>

        {bookmarkData.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex caption-bold gap-2">
              <img
                src="/assets/classwork/favorite-icon.svg"
                alt="favorite icon"
                width={24}
                height={24}
              />
              <div>งานที่บันทึกไว้</div>
            </div>
            <StudentWorkTable data={bookmarkData} />
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="caption-bold">งานทั้งหมด</div>
          <StudentWorkTable data={data} />
        </div>
      </WhiteContainer>
    </PageLayout>
  );
};

export default TeacherLearningActivityDetailPage;
