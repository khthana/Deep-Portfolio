import { useEffect, useState } from "react";
import Button from "../../../../../components/button/button";
import CreateGroupworkModal from "./create-groupwork-modal";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../../stores/stores";
import {
  fetchStudentActivityGroupInSec,
  fetchStudentLearningActivityGroupInSec,
  fetchStudentLearningActivityWithoutGroup,
  fetchStudentWithoutGroup,
} from "../../stores/course-action";
import type {
  ClassworkDetailFull,
  GetStudentActivityGroupInSecParams,
  GetStudentLearningActivityWithoutGroupParams,
  GetStudentWithoutGroupParams,
} from "../../types/course-type";

type Props = {
  handleFetchData: () => void;
  classworkDetail: ClassworkDetailFull;
};

const CreateGroupworkSection = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const courseSlice = useSelector((state: RootState) => state.studentCourse);

  const [openModal, setOpenModal] = useState<boolean>(false);

  const handleFetchStudentInSec = async () => {
    if (props.classworkDetail.category === "activity") {
      await handleFetchStudentActivityInSec();
    } else {
      await handleFetchStudentLearningActivityInSec();
    }
  };

  const handleFetchStudentActivityInSec = async () => {
    const getStudentWithoutGroupParams: GetStudentWithoutGroupParams = {
      section_id: props.classworkDetail.section_id,
      activity_id: props.classworkDetail.activity_id,
    };

    await dispatch(fetchStudentWithoutGroup(getStudentWithoutGroupParams));

    const getStudentActivityGroupInSecParams: GetStudentActivityGroupInSecParams =
      {
        section_id: props.classworkDetail.section_id,
        student_id: props.classworkDetail.student_id,
      };

    await dispatch(
      fetchStudentActivityGroupInSec(getStudentActivityGroupInSecParams),
    );
  };

  const handleFetchStudentLearningActivityInSec = async () => {
    const getStudentWithoutGroupParams: GetStudentLearningActivityWithoutGroupParams =
      {
        section_id: props.classworkDetail.section_id,
        learning_activity_id: props.classworkDetail.activity_id,
      };

    await dispatch(
      fetchStudentLearningActivityWithoutGroup(getStudentWithoutGroupParams),
    );

    const getStudentActivityGroupInSecParams: GetStudentActivityGroupInSecParams =
      {
        section_id: props.classworkDetail.section_id,
        student_id: props.classworkDetail.student_id,
      };

    await dispatch(
      fetchStudentLearningActivityGroupInSec(
        getStudentActivityGroupInSecParams,
      ),
    );
  };

  useEffect(() => {
    handleFetchStudentInSec();
  }, [courseSlice.selectedCourse]);

  return (
    <div className="w-full">
      <Button
        className="rounded-xl w-full"
        // disable={
        //   props.classworkDetail.status === "GRADED" ||
        //   checkIsOverSubmittionDeadline(props.classworkDetail.deadline_date)
        // }
        onClick={() => setOpenModal(true)}
      >
        สร้างกลุ่ม
      </Button>

      <CreateGroupworkModal
        openModal={openModal}
        setOpenModal={setOpenModal}
        handleFetchData={props.handleFetchData}
        classworkDetail={props.classworkDetail}
      />
    </div>
  );
};

export default CreateGroupworkSection;
