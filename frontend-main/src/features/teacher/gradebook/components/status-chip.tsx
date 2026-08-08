type Props = {
  status: {
    on_time: number;
    late: number;
    missing: number;
  };
};

const StatusChip = (props: Props) => {
  const statusMap = [
    {
      text: props.status.on_time,
      class: "bg-[rgb(59,139,92,0.2)] text-primary-green",
    },
    {
      text: props.status.late,
      class: "bg-[rgb(241,188,65,0.2)] text-[#C39939]",
    },
    {
      text: props.status.missing,
      class: "bg-[rgb(224,41,41,0.2)] text-primary-red",
    },
  ];

  return (
    <div className="flex caption-bold justify-center gap-2">
      {statusMap.map((status) => (
        <div className={`py-2 px-5 rounded-[50px] ${status.class}`}>
          {status.text}
        </div>
      ))}
    </div>
  );
};

export default StatusChip;
