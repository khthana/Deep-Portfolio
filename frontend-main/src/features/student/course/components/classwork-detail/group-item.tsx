import type {
  GetStudentActivityGroupResp,
  MemberDetailResp,
} from "../../types/course-type";

type Props = {
  group: GetStudentActivityGroupResp;
  handleOnSelectedGroup: (members: MemberDetailResp[]) => void;
};

const GroupItem = (props: Props) => {
  const allMemberId = props.group.members
    .map((member) => member.student_id)
    .join(", ");

  return (
    <div
      className="px-4 py-2 border border-primary-grey rounded-full flex justify-between items-center cursor-pointer"
      onClick={() => props.handleOnSelectedGroup(props.group.members)}
    >
      <div className="flex gap-3 body-medium-3 !text-[18px]">
        <div>{allMemberId}</div>
      </div>
    </div>
  );
};

export default GroupItem;
