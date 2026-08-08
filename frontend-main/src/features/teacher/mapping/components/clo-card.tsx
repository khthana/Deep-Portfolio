type Props = {
  cloData: {
    cloNumber: string;
    detail: string;
    id: number;
  };
};

const CLOCard = (props: Props) => {
  return (
    <div className="w-full 2xl:p-6 p-3 rounded-2xl border border-light-grey flex flex-col gap-2">
      <div className="caption-bold">CLO-{props.cloData.cloNumber}</div>
      <div>{props.cloData.detail}</div>
    </div>
  );
};

export default CLOCard;
