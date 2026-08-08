import { DeleteOutlined } from "@ant-design/icons";
import {
  memberStatusBGColor,
  memberStatusLabel,
  memberStatusTextColor,
  type MemberStatus,
} from "../../types/course-type";

type Props = {
  studentId: string;
  studentName: string;
  status?: MemberStatus;
  action?: boolean;
  handleOnRemove?: (value: string) => void;
};

const GroupMemberItem = ({
  studentId,
  studentName,
  handleOnRemove,
  status,
  action = false,
}: Props) => {
  return (
    <div className="px-4 py-2 border border-primary-grey rounded-full flex justify-between items-center">
      <div className="flex gap-3 body-medium-3 !text-[18px]">
        <div>{studentId}</div>
        <div>{studentName}</div>
      </div>

      <div className="flex gap-2">
        {status && (
          <div
            className="px-4 py-1 rounded-full caption-bold"
            style={{
              backgroundColor: memberStatusBGColor[status],
              color: memberStatusTextColor[status],
            }}
          >
            {memberStatusLabel[status]}
          </div>
        )}

        {action && (
          <DeleteOutlined
            className="duration-300 ease-in-out hover:!text-red-500 cursor-pointer"
            style={{ fontSize: "20px" }}
            onClick={() => handleOnRemove?.(studentId)}
          />
        )}
      </div>
    </div>
  );
};

export default GroupMemberItem;
