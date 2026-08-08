import { Select } from "antd";
import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import PersonGradebookTable from "../components/person-gradebook-table";
import AssignmentGradebookTable from "../components/assignment-gradebook-table";
import { useEffect, useState } from "react";
import PageLayout from "../../../../components/container/page-layout";
import WhiteContainer from "../../../../components/container/white-container";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGradebookPerActivity,
  fetchGradebookPerStudent,
} from "../stores/teacher-gradebook-action";
import type { StudentActivityStatusDB } from "../../../../types/activity-type.type";
import type {
  AssignmentHeaderColumnType,
  GradebookPerActivityDataType,
  GradebookPerStudentDataType,
} from "../types/gradebook-type.type";

const options = [
  { label: "รายบุคคล", value: "PERSON" },
  { label: "รายกิจกรรม", value: "ASSIGNMENT" },
];

const TeacherGradebookPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const teacherHomeSlice = useSelector((state: RootState) => state.teacherHome);

  const [selectedMode, setSelectedMode] = useState<"PERSON" | "ASSIGNMENT">(
    "PERSON",
  );
  const [gradebookPerStudentData, setGradebookPerStudentData] = useState<
    GradebookPerStudentDataType[]
  >([]);
  const [assignmentHeaderColumn, setAssignmentHeaderColumn] = useState<
    AssignmentHeaderColumnType[]
  >([]);

  const [gradebookPerActivityData, setGradebookPerActivityData] = useState<
    GradebookPerActivityDataType[]
  >([]);

  const handleOnChange = (value: "PERSON" | "ASSIGNMENT") => {
    setSelectedMode(value);
  };

  const handleFetchData = async () => {
    if (!teacherHomeSlice.selectedCourse) return;

    const params = { section_id: teacherHomeSlice.selectedCourse.section_id };
    const { data } = await dispatch(fetchGradebookPerStudent(params)).unwrap();
    const { data: dataActivity } = await dispatch(
      fetchGradebookPerActivity(params),
    ).unwrap();

    setGradebookPerActivityData(
      dataActivity.activities.map((activity, index) => ({
        key: activity.activity_id,
        no: index + 1,
        title: activity.activity_name,
        deadline: activity.deadline_date,
        submitted_count: activity.submitted_count,
        graded_count: activity.graded_count,
        not_submitted_count: activity.not_submitted_count,
        full_score: activity.full_score,
        max: activity.max_score,
        min: activity.min_score,
        mean: activity.mean_score,
        id: activity.activity_id,
      })),
    );

    setGradebookPerStudentData(
      data.students.map((student, index) => ({
        key: student.student_id,
        no: index + 1,
        student_id: student.student_id,
        student_name: student.student_name,
        submit_status: {
          on_time: student.on_time_submissions,
          late: student.late_submissions,
          missing: student.missing_submissions,
        },
        total_score: student.total_score,
        activities: student.activities.map((activity) => ({
          activity_id: activity.activity_id,
          activity_name: activity.activity_name,
          full_score: activity.full_score,
          score: activity.score,
          status: activity.status || undefined,
        })),
      })),
    );

    setAssignmentHeaderColumn(
      data.students[0]?.activities.map((activity) => ({
        activity_id: activity.activity_id,
        activity_name: activity.activity_name,
        full_score: activity.full_score,
      })) || [],
    );
  };

  useEffect(() => {
    handleFetchData();
  }, [teacherHomeSlice.selectedCourse]);

  return (
    <PageLayout>
      <TeacherBreadcrumb title="สมุดคะแนน" />

      <WhiteContainer>
        <div className="flex justify-between items-center body-bold-1 pb-5 border-b border-light-grey">
          <div>สมุดคะแนน</div>
          <Select
            className="w-30"
            options={options}
            defaultValue={selectedMode}
            onChange={handleOnChange}
          />
        </div>

        {selectedMode === "PERSON" ? (
          <div className="flex flex-col gap-8">
            <StatusChip />
            <PersonGradebookTable
              data={gradebookPerStudentData}
              assignmentHeaderColumn={assignmentHeaderColumn}
            />
          </div>
        ) : (
          <AssignmentGradebookTable
            gradebookPerActivityData={gradebookPerActivityData}
          />
        )}
      </WhiteContainer>
    </PageLayout>
  );
};

//----------------------------------------------

const StatusChip = () => {
  return (
    <div className="flex gap-4 caption-bold">
      <div className="flex gap-1 items-center">
        <div className="bg-primary-green rounded-full w-4 h-4"></div>
        <div>ส่งตรงเวลา</div>
      </div>
      <div className="flex gap-1 items-center">
        <div className="bg-primary-yellow rounded-full w-4 h-4"></div>
        <div>ส่งล่าช้า</div>
      </div>
      <div className="flex gap-1 items-center">
        <div className="bg-primary-red rounded-full w-4 h-4"></div>
        <div>ขาดส่ง</div>
      </div>
    </div>
  );
};

export default TeacherGradebookPage;
