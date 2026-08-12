import { useParams } from "react-router-dom";
import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import PageLayout from "../../../../components/container/page-layout";
import WhiteContainer from "../../../../components/container/white-container";
import StudentWorkTable from "../components/student-work-table";
import type { Submission, SubmissionStatus } from "../types/activity-type.type";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../../stores/stores";
import {
  fetchAllSubmittedActivityList,
  getValidateActivityCLOMapping,
} from "../stores/teacher-activity-action";
import { useEffect, useState } from "react";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";
import { formatUnacceptedMembers } from "../../../../utils/format-unaccepted-member";

export type DataType = {
  key: string;
  no: number;
  submitted_date: string;
  code: string[];
  name: string[];
  // Kept out of `code` and `name` on purpose: those two are the people this
  // score lands on, and a name that is not being marked must not read as one
  // that is (ADR-0023).
  unaccepted: string[];
  status: SubmissionStatus;
  score: number | null;
  feedback: string;
  remark: string;
  id?: number;
  isNew?: boolean;
};

/**
 * One row of the marking table. The full list and the bookmarked list show the
 * same columns, so they are built the same way and only differ in what is fed
 * in.
 */
const toRow = (classwork: Submission, dataIndex: number): DataType => {
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
        ? [`${classwork.student.first_name_th} ${classwork.student.last_name_th}`]
        : [];

  return {
    key: classwork.id.toString(),
    no: dataIndex + 1,
    submitted_date: convertDateToThaiFormat(classwork.submitted_at) ?? "-",
    code: studentCode,
    name: studentName,
    unaccepted: formatUnacceptedMembers(classwork.group?.unaccepted_members),
    status:
      classwork.status === "GRADED" ? "GRADED" : ("PENDING" as SubmissionStatus),
    score: classwork.score,
    remark: classwork.remark ?? "",
    feedback: classwork.feedback ?? "",
    id: classwork.id,
  };
};

const TeacherActivityDetailPage = () => {
  const { activityId } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  const [data, setData] = useState<DataType[]>([]);
  const [bookmarkData, setBookmarkData] = useState<DataType[]>([]);
  const [activityData, setActivityData] = useState<{
    activity_name: string;
    deadline_date: Date | null;
    score: number | null;
  }>();
  const [validateMessage, setValidateMessage] = useState<string | null>(null);

  const handleFetchData = async () => {
    if (!activityId) return;

    const { data } = await dispatch(
      fetchAllSubmittedActivityList(parseInt(activityId)),
    ).unwrap();

    const validateData = await dispatch(
      getValidateActivityCLOMapping(parseInt(activityId)),
    ).unwrap();

    if (!validateData.data) {
      setValidateMessage(
        "กรุณาเชื่อมโยงกิจกรรมการประเมินเข้ากับผลการเรียนรู้ในหน้าวางแผนรายวิชา",
      );
    }

    setActivityData({
      activity_name: data.activity_name,
      deadline_date: data.deadline_date,
      score: data.score,
    });

    const bookmark = data.submissions.filter((item) => item.is_bookmark);

    setData(data.submissions.map(toRow));
    setBookmarkData(bookmark.map(toRow));
  };

  useEffect(() => {
    handleFetchData();
  }, [activityId]);

  return (
    <PageLayout>
      <TeacherBreadcrumb
        title="กิจกรรมการประเมิน"
        subtitle={activityData?.activity_name}
      />

      <WhiteContainer>
        <div className="pb-5 border-b border-light-grey flex justify-between">
          <div>
            <div className="body-bold-1">{activityData?.activity_name}</div>
            {activityData?.deadline_date && (
              <div>
                กำหนดส่ง: {convertDateToThaiFormat(activityData.deadline_date)}
              </div>
            )}
          </div>
          {activityData?.score && (
            <div className="text-secondary-blue caption-bold">
              {activityData.score} คะแนน
            </div>
          )}
        </div>

        {bookmarkData.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between">
              <div className="flex caption-bold gap-2">
                <img
                  src="/assets/classwork/favorite-icon.svg"
                  alt="favorite icon"
                  width={24}
                  height={24}
                />
                <div>งานที่บันทึกไว้</div>
              </div>

              <div className="caption-bold text-primary-red">
                {validateMessage}
              </div>
            </div>
            <StudentWorkTable data={bookmarkData} />
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <div className="caption-bold">งานทั้งหมด</div>
            {bookmarkData.length === 0 && (
              <div className="caption-bold text-primary-red">
                {validateMessage}
              </div>
            )}
          </div>
          <StudentWorkTable data={data} />
        </div>
      </WhiteContainer>
    </PageLayout>
  );
};

export default TeacherActivityDetailPage;
