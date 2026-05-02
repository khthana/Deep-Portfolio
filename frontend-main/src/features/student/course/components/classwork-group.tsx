import type { ClassworkDetail } from "../types/course-type";
import ClassworkCard from "./classwork-card";

type Props = {
  groupName: string;
  classworks: ClassworkDetail[];
};

const ClassworkGroup = (props: Props) => {
  return (
    <div className="flex justify-center">
      <div className="w-full px-6 flex flex-col gap-2">
        <div className="body-bold-2">{props.groupName}</div>
        {props.classworks.map((classwork, index) => (
          <ClassworkCard key={index} classworkDetail={classwork} />
        ))}
      </div>
    </div>
  );
};

export default ClassworkGroup;
