import CLOCard from "./clo-card";

type Props = {
  cloData: {
    cloNumber: string;
    detail: string;
    id: number;
  };
};

const CLOSection = (props: Props) => {
  return (
    <div className="p-4 2xl:p-8 rounded-2xl bg-white flex flex-col gap-4 2xl:gap-8">
      <div className="pb-5 border-b border-light-grey body-bold-3 text-center">
        ผลการเรียนรู้ (CLOs)
      </div>

      <CLOCard cloData={props.cloData} />
    </div>
  );
};

export default CLOSection;
