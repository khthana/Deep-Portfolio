import type {
  MockClassworkType,
} from "../../types/experience-skill-type.type";

type Props = {
  data: MockClassworkType;
};

const ClassworkCard = (props: Props) => {
  return (
    <div className="py-4 pl-5 rounded-2xl hover:bg-[#F9F9F9] flex justify-between cursor-pointer">
      <div className="flex flex-col">
        <div>{props.data.name}</div>
        <div className="text-primary-grey">
          {props.data.subject_code} - {props.data.subject}
        </div>
      </div>

      <div className="flex gap-4">
        <img
          src="/assets/course/eye-icon.svg"
          alt="eye icon"
          width={24}
          height={24}
        />
        <img
          src="/assets/course/assignment-icon.svg"
          alt="assignment icon"
          width={24}
          height={24}
        />
        <img
          src="/assets/course/edit-icon.svg"
          alt="edit icon"
          className="cursor-pointer"
          width={24}
          height={24}
        />
        <img
          src="/assets/course/delete-icon.svg"
          alt="delete icon"
          className="cursor-pointer"
          width={24}
          height={24}
        />
      </div>
    </div>
  );
};

export default ClassworkCard;
