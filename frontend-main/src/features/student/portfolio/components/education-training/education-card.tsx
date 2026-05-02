import WhiteContainer from "../../../../../components/container/white-container";
import type { MockEducationType } from "../../types/education-section-type.type";

import { Popconfirm } from "antd";
import { convertToBE } from "../../../../../utils/year-utils";

type Props = {
  data: MockEducationType;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
};

const EducationCard = (props: Props) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const isPresent =
    !props.data.endYear ||
    props.data.endYear === 0 ||
    props.data.endYear >= currentYear;

  return (
    <WhiteContainer>
      <div className="flex gap-16 w-full items-start">
        <div className="body-bold-1 text-primary-orange text-nowrap">
          {props.data.startYear ? convertToBE(props.data.startYear) : ""} -{" "}
          {isPresent
            ? "ปัจจุบัน"
            : props.data.endYear
              ? convertToBE(props.data.endYear)
              : ""}
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="w-full flex justify-between pb-2 border-b border-light-grey">
            <div className="body-bold-3">{props.data.degree}</div>
            <div className="flex gap-2">
              <img
                src="/assets/course/edit-icon.svg"
                alt="edit icon"
                width={24}
                height={24}
                className="cursor-pointer"
                onClick={() => props.onEdit && props.onEdit(props.data.id)}
              />
              <Popconfirm
                title="ลบรายการ"
                description="คุณต้องการลบรายการนี้ใช่หรือไม่?"
                onConfirm={() =>
                  props.onDelete && props.onDelete(props.data.id)
                }
                okText="ใช่"
                cancelText="ไม่"
              >
                <img
                  src="/assets/course/delete-icon.svg"
                  alt="delete icon"
                  width={24}
                  height={24}
                  className="cursor-pointer"
                />
              </Popconfirm>
            </div>
          </div>

          <div>
            <div>{props.data.university}</div>
            <div className="text-primary-grey">{props.data.faculty}</div>
          </div>
          <div
            className={`body-small-1 ${
              props.data.isShow ? "text-success" : "text-red-500"
            }`}
          >
            {!props.data.isShow && (
              <div className="text-red-500 text-sm">ไม่แสดงบนหน้าเว็บผลงาน</div>
            )}
          </div>
        </div>
      </div>
    </WhiteContainer>
  );
};

export default EducationCard;
