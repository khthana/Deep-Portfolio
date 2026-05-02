import { useEffect, useState } from "react";
import WhiteContainer from "../../../../../components/container/white-container";
import ShowDetailCheckbox from "../show-detail-checkbox";
import type { MockProfessionalQualificationType } from "../../types/education-section-type.type";

type Props = {
  data: MockProfessionalQualificationType;
};

const ProfessionalQualificationCard = (props: Props) => {
  const [isShowDetail, setIsShowDetail] = useState<boolean>(false);

  const handleOnClick = () => {
    setIsShowDetail((prev) => !prev);
  };

  return (
    <WhiteContainer>
      <div className="flex gap-16 w-full items-start">
        <div className="body-bold-1 text-primary-orange text-nowrap">
          {props.data.year}
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="w-full flex justify-between pb-2 border-b border-light-grey">
            <div className="body-bold-3">{props.data.name}</div>
            <div className="flex gap-2">
              <img
                src="/assets/course/edit-icon.svg"
                alt="edit icon"
                width={24}
                height={24}
                className="cursor-pointer"
              />
              <img
                src="/assets/course/delete-icon.svg"
                alt="delete icon"
                width={24}
                height={24}
                className="cursor-pointer"
              />
            </div>
          </div>

          <div>
            <div>{props.data.organizer}</div>
            <div className="text-primary-grey">{props.data.description}</div>
          </div>
          <ShowDetailCheckbox checked={isShowDetail} onClick={handleOnClick} />
        </div>
      </div>
    </WhiteContainer>
  );
};

export default ProfessionalQualificationCard;
