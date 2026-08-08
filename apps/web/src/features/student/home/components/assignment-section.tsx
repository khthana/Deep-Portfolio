import { Collapse, type CollapseProps } from "antd";
import AssignmentCard from "./assignment-card";
import {
  AssignmentDueType,
  assignmentGroupLabel,
  AssignmentGroupType,
  type GetStudentAllCLassworkListParams,
} from "../types/home-type";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { fetchAllClasswork, fetchStudentDetail } from "../stores/home-action";
import { useEffect } from "react";
import {
  checkIsToday,
  checkIsTomorrow,
} from "../../../../utils/format-thai-date";

const AssignmentSection = () => {
  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.home);

  const handleFetchAllClasswork = async () => {
    const params: GetStudentAllCLassworkListParams = {
      student_id: homeSlice.studentId,
      semester: homeSlice.semester,
      academic_year: homeSlice.academicYear,
    };

    await dispatch(fetchAllClasswork(params));
  };

  // const handleFetchStudentDetail = async () => {
  //   await dispatch(fetchStudentDetail(homeSlice.studentId));
  // };

  useEffect(() => {
    handleFetchAllClasswork();
    // handleFetchStudentDetail();
  }, []);

  const assignmentHeaderItems: CollapseProps["items"] = [
    {
      key: AssignmentGroupType.LATE,
      label: assignmentGroupLabel[AssignmentGroupType.LATE],
      children: (
        <div className="grid grid-cols-3 gap-4">
          {homeSlice.allClasswork?.late.map((classwork, index) => (
            <AssignmentCard
              key={index}
              classworkDetail={classwork}
              assignmentDueType={AssignmentDueType.LATE}
            />
          ))}
        </div>
      ),
      extra: (
        <div className="text-primary-orange">
          {homeSlice.allClasswork?.late.length}
        </div>
      ),
    },
    {
      key: AssignmentGroupType.THIS_WEEK,
      label: assignmentGroupLabel[AssignmentGroupType.THIS_WEEK],
      children: (
        <div className="grid grid-cols-3 gap-4">
          {homeSlice.allClasswork?.this_week.map((classwork, index) => {
            const isToday = checkIsToday(classwork.date);
            const isTomorrow = checkIsTomorrow(classwork.date);

            return (
              <AssignmentCard
                key={index}
                classworkDetail={classwork}
                assignmentDueType={
                  isToday
                    ? AssignmentDueType.TODAY
                    : isTomorrow
                      ? AssignmentDueType.TOMORROW
                      : AssignmentDueType.UPCOMING
                }
              />
            );
          })}
        </div>
      ),
      extra: (
        <div className="text-primary-orange">
          {homeSlice.allClasswork?.this_week.length}
        </div>
      ),
    },
    {
      key: AssignmentGroupType.UPCOMING,
      label: assignmentGroupLabel[AssignmentGroupType.UPCOMING],
      children: (
        <div className="flex 2xl:gap-4 gap-2 flex-wrap">
          {homeSlice.allClasswork?.upcoming.map((classwork, index) => (
            <AssignmentCard
              key={index}
              classworkDetail={classwork}
              assignmentDueType={AssignmentDueType.UPCOMING}
            />
          ))}
        </div>
      ),
      extra: (
        <div className="text-primary-orange">
          {homeSlice.allClasswork?.upcoming.length}
        </div>
      ),
    },
    {
      key: AssignmentGroupType.SUBMITTED,
      label: assignmentGroupLabel[AssignmentGroupType.SUBMITTED],
      children: (
        <div className="grid grid-cols-3 gap-4">
          {homeSlice.allClasswork?.submitted.map((classwork, index) => (
            <AssignmentCard
              key={index}
              classworkDetail={classwork}
              assignmentDueType={AssignmentDueType.SUBMITTED}
            />
          ))}
        </div>
      ),
      extra: (
        <div className="text-primary-orange">
          {homeSlice.allClasswork?.submitted.length}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex 2xl:gap-4 gap-2">
        <img
          src="/assets/home/assignment-icon.svg"
          alt="assigment icon"
          className="2xl:w-13 w-8"
        />
        <div className="body-bold-1 text-primary-orange">
          งานที่ได้รับมอบหมาย
        </div>
      </div>

      <Collapse
        items={assignmentHeaderItems}
        size="large"
        bordered={false}
        defaultActiveKey={AssignmentGroupType.THIS_WEEK}
        expandIconPosition="end"
      />
    </div>
  );
};

export default AssignmentSection;
