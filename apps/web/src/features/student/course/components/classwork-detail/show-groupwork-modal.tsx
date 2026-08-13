import { message, Modal, Select } from "antd";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import GroupMemberItem from "./group-member-item";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../../stores/stores";
import type { Options } from "../../../../../types/global-type";
import type {
  ClassworkDetailFull,
  GetStudentActivityGroupResp,
  GetStudentLearningActivityWithoutGroupParams,
  GetStudentWithoutGroupParams,
  GroupRole,
  MemberDetail,
  MemberStatus,
  ResendInviteBody,
  UpdateStudentActivityGroupBody,
} from "../../types/course-type";
import Button from "../../../../../components/button/button";
import {
  fetchStudentLearningActivityWithoutGroup,
  fetchStudentWithoutGroup,
  patchStudentActivityGroup,
  patchStudentLearningActivityGroup,
  postResendActivityGroupInvite,
  postResendLearningActivityGroupInvite,
} from "../../stores/course-action";
import { isGroupLeader } from "../../utils/is-group-leader";
import { messageToShow } from "../../../../../utils/api-error";

type SelectedMembersType = {
  studentName: string;
  studentId: string;
  role: GroupRole;
  status?: MemberStatus;
};

type Props = {
  openModal: boolean;
  setOpenModal: Dispatch<SetStateAction<boolean>>;
  handleFetchStudentGroup: () => void;
  studentGroupWork: GetStudentActivityGroupResp;
  classworkDetail: ClassworkDetailFull;
};

const ShowGroupworkModal = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const [messageApi, contextHolder] = message.useMessage();

  const courseSlice = useSelector((state: RootState) => state.studentCourse);
  const homeSlice = useSelector((state: RootState) => state.home);

  const isLeader = isGroupLeader(
    props.studentGroupWork?.members,
    homeSlice.studentId,
  );

  const [memberOptions, setMemberOptions] = useState<Options[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SelectedMembersType[]>(
    [],
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const mapOptions = () => {
    if (courseSlice.studentList.length > 0) {
      const members: Options[] = courseSlice.studentList.map((student) => {
        return {
          label: `${student.student_id} ${student.full_name_th}`,
          value: student.student_id ?? 0,
        };
      });

      setMemberOptions(members);
    }
  };

  const mapInitData = () => {
    if (
      props.studentGroupWork &&
      props.studentGroupWork?.members &&
      props.studentGroupWork?.members.length > 0
    ) {
      const mapMembers = props.studentGroupWork?.members.map((member) => ({
        studentId: member.student_id,
        studentName: member.student_name,
        role: member.role,
        status: member.status,
      }));

      setSelectedMembers(mapMembers);
    }
  };

  const handleOnChange = (value: string, role: GroupRole) => {
    const studentOptions = courseSlice.studentList.find((member) => {
      return member.student_id === value;
    });

    if (!studentOptions) return;

    setSelectedMembers((prev) => [
      ...prev,
      {
        studentId: studentOptions.student_id ?? "",
        studentName: studentOptions.full_name_th ?? "",
        role: role,
      },
    ]);
  };

  const handleOnRemove = (value: string) => {
    setSelectedMembers((prev) =>
      prev.filter((member) => member.studentId !== value),
    );
  };

  const handleOnCancel = () => {
    mapInitData();
    setIsEditing(false);
  };

  const handleOnSubmit = async () => {
    try {
      const members: MemberDetail[] = selectedMembers.map((member) => ({
        student_id: member.studentId,
        role: member.role,
      }));

      const body: UpdateStudentActivityGroupBody = {
        group_id: props.studentGroupWork.group_id,
        members: members,
      };

      const resp =
        props.classworkDetail.category === "activity"
          ? await dispatch(patchStudentActivityGroup(body)).unwrap()
          : await dispatch(patchStudentLearningActivityGroup(body)).unwrap();

      if (resp.success) {
        messageApi.success("แก้ไขสำเร็จ");
        handleFetchStudentWithoutGroup();
        props.handleFetchStudentGroup();
        setIsEditing(false);
        props.setOpenModal(false);
      }
    } catch {
      messageApi.error("เกิดข้อผิดพลาดในการแก้ไขกลุ่ม");
    }
  };

  /**
   * A fresh invitation for one member who has not answered yet (#57).
   *
   * Nothing on the screen changes on success — the endpoint only ever succeeds
   * on a PENDING member and leaves them PENDING, so the row still says
   * "รออนุมัติ" and the group is not re-read: the toast is the whole of the
   * answer. The API's own sentence is shown when it sent one, and it is the
   * only thing that distinguishes a member who accepted between the page load
   * and the click from one who is simply not in the group.
   */
  const handleOnResend = async (studentId: string) => {
    try {
      const body: ResendInviteBody = {
        group_id: props.studentGroupWork.group_id,
        student_id: studentId,
      };

      const resp =
        props.classworkDetail.category === "activity"
          ? await dispatch(postResendActivityGroupInvite(body)).unwrap()
          : await dispatch(postResendLearningActivityGroupInvite(body)).unwrap();

      if (resp.success) {
        messageApi.success("ส่งคำเชิญอีกครั้งแล้ว");
      }
    } catch (err) {
      messageApi.error(messageToShow(err, "เกิดข้อผิดพลาดในการส่งคำเชิญ"));
    }
  };

  const handleFetchStudentWithoutGroup = async () => {
    if (!courseSlice.selectedClasswork) return;

    const getStudentWithoutGroupParams: GetStudentWithoutGroupParams = {
      section_id: props.classworkDetail.section_id,
      activity_id: props.classworkDetail.activity_id,
    };

    const getStudentLearningActivityWithoutGroupParams: GetStudentLearningActivityWithoutGroupParams =
      {
        section_id: props.classworkDetail.section_id,
        learning_activity_id: props.classworkDetail.activity_id,
      };

    if (props.classworkDetail.category === "activity") {
      await dispatch(fetchStudentWithoutGroup(getStudentWithoutGroupParams));
    } else {
      await dispatch(
        fetchStudentLearningActivityWithoutGroup(
          getStudentLearningActivityWithoutGroupParams,
        ),
      );
    }
  };

  // One modal is one piece of work, so only its own category's resend can be in
  // flight; watching both flags would grey the rows for a request this screen
  // never sent.
  const resendLoading =
    props.classworkDetail.category === "activity"
      ? courseSlice.postResendActivityGroupInviteLoading
      : courseSlice.postResendLearningActivityGroupInviteLoading;

  const filterOptions = memberOptions.filter(
    (option) =>
      !selectedMembers
        .map((member) => member.studentId)
        .includes(option.value.toString()),
  );

  useEffect(() => {
    if (courseSlice.studentList.length > 0) {
      mapOptions();
    }
  }, [courseSlice.studentList]);

  useEffect(() => {
    mapInitData();
  }, [props.studentGroupWork]);

  return (
    <Modal
      open={props.openModal}
      onCancel={() => {
        handleOnCancel();
        props.setOpenModal(false);
      }}
      width={600}
      footer={null}
      centered
    >
      {contextHolder}

      <div className="flex flex-col gap-5">
        <div className="pb-3 border-b border-light-grey flex justify-between">
          <div className="body-bold-1">กลุ่มของฉัน</div>
        </div>

        {isEditing && (
          <div className="div-search-member">
            <Select
              onChange={(value: string) => handleOnChange(value, "MEMBER")}
              showSearch
              placeholder="ค้นหารหัสนักศึกษา"
              className="search-member"
              style={{ borderRadius: "50px" }}
              value={null}
              options={filterOptions}
            />
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="body-bold-3">สมาชิกในกลุ่ม</div>
            {!isEditing &&
              isLeader &&
              props.classworkDetail.status !== "GRADED" && (
                <div
                  className="text-secondary-blue underline caption-regular cursor-pointer"
                  onClick={() => setIsEditing(true)}
                >
                  แก้ไข
                </div>
              )}
          </div>

          {selectedMembers.length > 0 &&
            selectedMembers.map((member) => (
              <GroupMemberItem
                key={member.studentId}
                studentId={member.studentId}
                studentName={member.studentName}
                status={member.status}
                handleOnRemove={handleOnRemove}
                action={
                  isEditing &&
                  member.role === "MEMBER" &&
                  member.status !== "ACCEPT"
                }
                // Only the leader may resend, and only to a member still holding
                // an unanswered invitation — the same two rules the API enforces
                // (#57). One who said no is left to be asked in person.
                resend={
                  !isEditing &&
                  isLeader &&
                  member.status === "PENDING" &&
                  props.classworkDetail.status !== "GRADED"
                }
                resendLoading={resendLoading}
                handleOnResend={handleOnResend}
              />
            ))}
        </div>

        {isEditing && (
          <div className="flex flex-col gap-2">
            <Button
              className="rounded-xl"
              onClick={handleOnSubmit}
              loading={
                courseSlice.postStudentActivityGroupLoading ||
                courseSlice.patchStudentActivityGroupLoading ||
                courseSlice.patchStudentLearningActivityGroupLoading ||
                courseSlice.postStudentLearningActivityGroupLoading
              }
            >
              บันทึก
            </Button>
            <Button
              className="rounded-xl"
              variant="secondary"
              onClick={handleOnCancel}
              loading={
                courseSlice.postStudentActivityGroupLoading ||
                courseSlice.patchStudentActivityGroupLoading ||
                courseSlice.patchStudentLearningActivityGroupLoading ||
                courseSlice.postStudentLearningActivityGroupLoading
              }
            >
              ยกเลิก
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShowGroupworkModal;
