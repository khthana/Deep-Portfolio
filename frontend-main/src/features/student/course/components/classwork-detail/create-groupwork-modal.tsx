import { message, Modal, Select } from "antd";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import GroupMemberItem from "./group-member-item";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../../stores/stores";
import type { Options } from "../../../../../types/global-type";
import type {
  ClassworkDetailFull,
  CreateStudentActivityGroupBody,
  CreateStudentLearningActivityGroupBody,
  GroupRole,
  MemberDetail,
  MemberDetailResp,
} from "../../types/course-type";
import Button from "../../../../../components/button/button";
import {
  postStudentActivityGroup,
  postStudentLearningActivityGroup,
} from "../../stores/course-action";
import GroupItem from "./group-item";

type Props = {
  openModal: boolean;
  setOpenModal: Dispatch<SetStateAction<boolean>>;
  handleFetchData: () => void;
  classworkDetail: ClassworkDetailFull;

  // for edit flow
  membersData?: MemberDetailResp[];
};

const CreateGroupworkModal = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [messageApi, contextHolder] = message.useMessage();

  const courseSlice = useSelector((state: RootState) => state.studentCourse);
  const homeSlice = useSelector((state: RootState) => state.home);

  const [memberOptions, setMemberOptions] = useState<Options[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<
    { studentName: string; studentId: string; role: GroupRole }[]
  >([]);

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

  const handleOnChange = (value: string, role: GroupRole) => {
    const studentOptions = courseSlice.studentList.find((member) => {
      return member.student_id === value;
    });

    if (!studentOptions) return;

    setSelectedMembers((prev) => {
      // ตรวจสอบว่ามีสมาชิกคนนี้อยู่แล้วหรือไม่ เพื่อป้องกันการเพิ่มซ้ำ
      if (prev.some((member) => member.studentId === value)) {
        return prev;
      }
      return [
        ...prev,
        {
          studentId: studentOptions.student_id ?? "",
          studentName: studentOptions.full_name_th ?? "",
          role: role,
        },
      ];
    });
  };

  const handleOnRemove = (value: string) => {
    setSelectedMembers((prev) =>
      prev.filter((member) => member.studentId !== value),
    );
  };

  const handleOnSelectedGroup = (members: MemberDetailResp[]) => {
    const mapMembers = members
      .map((member) => ({
        studentId: member.student_id,
        studentName: member.student_name,
        role:
          member.student_id === courseSlice.selectedClasswork?.student_id
            ? "LEADER"
            : ("MEMBER" as GroupRole),
      }))
      .sort((a, b) => {
        if (a.role === "LEADER") return -1;
        if (b.role === "LEADER") return 1;

        return a.studentId.localeCompare(b.studentId);
      });

    setSelectedMembers(mapMembers);
  };

  const handleOnSubmit = async () => {
    try {
      const members: MemberDetail[] = selectedMembers.map((member) => ({
        student_id: member.studentId,
        role: member.role,
      }));

      const resp =
        props.classworkDetail.category === "activity"
          ? await handleOnSubmitActivity(members)
          : await handleOnSubmitLearningActivity(members);

      if (resp.success) {
        messageApi.success("สร้างกลุ่มสำเร็จ");
        props.setOpenModal(false);

        setTimeout(() => {
          // navigate(0);
          props.handleFetchData();
        }, 500);
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการสร้างกลุ่ม");
    }
  };

  const handleOnSubmitActivity = async (members: MemberDetail[]) => {
    const body: CreateStudentActivityGroupBody = {
      activity_id: props.classworkDetail.activity_id,
      members: members,
    };

    return await dispatch(postStudentActivityGroup(body)).unwrap();
  };

  const handleOnSubmitLearningActivity = async (members: MemberDetail[]) => {
    const body: CreateStudentLearningActivityGroupBody = {
      learning_activity_id: props.classworkDetail.activity_id,
      members: members,
    };

    return await dispatch(postStudentLearningActivityGroup(body)).unwrap();
  };

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
    if (
      homeSlice.studentId &&
      courseSlice.studentList.length > 0 &&
      selectedMembers.length === 0 &&
      !props.membersData
    ) {
      console.log("homeSlice.studentId : ", homeSlice.studentId);
      handleOnChange(homeSlice.studentId, "LEADER");
    }
  }, [homeSlice.studentId, courseSlice.studentList]);

  useEffect(() => {
    if (props.membersData && props.membersData.length > 0) {
      const mapMembers = props.membersData.map((member) => ({
        studentId: member.student_id,
        studentName: member.student_name,
        role: member.role,
      }));

      setSelectedMembers(mapMembers);
    }
  }, [props.membersData]);

  // useEffect(() => {
  //   console.log("selected : ", selectedMembers);
  // }, [selectedMembers]);

  return (
    <Modal
      open={props.openModal}
      onCancel={() => props.setOpenModal(false)}
      width={600}
      footer={null}
      centered
    >
      {contextHolder}

      <div className="flex flex-col gap-5">
        <div className="pb-3 border-b border-light-grey flex justify-between">
          <div className="body-bold-1">สร้างกลุ่ม</div>
        </div>

        {/* <Input
          placeholder="ค้นหารหัสนักศึกษา"
          className="!w-full !rounded-full !border-primary-grey !py-2 !px-4 !text-xl"
          size="large"
          prefix={
            <SearchOutlined style={{ color: "#7C7C7C", marginRight: "8px" }} />
          }
        /> */}

        <div className="div-search-member">
          <Select
            onChange={(value: string) => handleOnChange(value, "MEMBER")}
            // mode="multiple"
            showSearch
            placeholder="ค้นหารหัสนักศึกษา"
            className="search-member"
            style={{ borderRadius: "50px" }}
            //   size="large"
            value={null}
            options={filterOptions}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="body-bold-3">สมาชิกในกลุ่ม</div>
          {/* <GroupMemberItem
            studentId="65010600"
            studentName="ประทานพร ธรรมวงษานันท์"
          /> */}

          {selectedMembers.length > 0 &&
            selectedMembers.map((member) => (
              <GroupMemberItem
                key={member.studentId}
                studentId={member.studentId}
                studentName={member.studentName}
                action={member.role === "MEMBER"}
                handleOnRemove={handleOnRemove}
              />
            ))}
        </div>

        {courseSlice.studentGroupInSec.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="body-bold-3">กลุ่มที่เคยสร้าง</div>

            {courseSlice.studentGroupInSec.map((group) => (
              <GroupItem
                group={group}
                handleOnSelectedGroup={handleOnSelectedGroup}
              />
            ))}
          </div>
        )}

        <Button
          className="rounded-xl"
          onClick={handleOnSubmit}
          loading={
            courseSlice.postStudentActivityGroupLoading ||
            courseSlice.postStudentLearningActivityGroupLoading ||
            courseSlice.patchStudentActivityGroupLoading ||
            courseSlice.patchStudentLearningActivityGroupLoading
          }
        >
          สร้างกลุ่ม
        </Button>
      </div>
    </Modal>
  );
};

export default CreateGroupworkModal;
