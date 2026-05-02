import {
  submissionStatusBGColor,
  submissionStatusLabel,
  submissionStatusTextColor,
  type SubmissionStatus,
} from "../types/activity-type.type";

type Props = {
  status: SubmissionStatus;
};

const StatusChip = (props: Props) => {
  return (
    <div
      className="rounded-[50px] px-3 py-1 w-fit caption-bold"
      style={{
        backgroundColor: submissionStatusBGColor[props.status],
        color: submissionStatusTextColor[props.status],
      }}
    >
      {submissionStatusLabel[props.status]}
    </div>
  );
};

export default StatusChip;
