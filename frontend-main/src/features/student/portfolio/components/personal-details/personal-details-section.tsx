import WhiteContainer from "../../../../../components/container/white-container";
import TitleWithEditIcon from "../title-with-edit-icon";
import { getFile } from "../../../../../utils/get-file";

import type { UserResp } from "../../../../../types/user-type.type";
import type { PortfolioPersonalResp } from "../../../../../types/portfolio-personal-type.type";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { useEffect } from "react";

dayjs.locale("th");

type PersonalDetailsSectionProps = {
  user: UserResp | null;
  portfolioPersonal: PortfolioPersonalResp | null;
  imageUrl?: string | null;
  onEdit: () => void;
};

const PersonalDetailsSection = ({
  user,
  portfolioPersonal,
  imageUrl,
  onEdit,
}: PersonalDetailsSectionProps) => {
  const { title_th, first_name_th, last_name_th, first_name_en, last_name_en } = user || {};
  const fullNameTh = first_name_th && last_name_th ? `${first_name_th} ${last_name_th}` : "-";
  const fullNameEn = first_name_en && last_name_en ? `${first_name_en} ${last_name_en}` : "-";

  const birthDate = portfolioPersonal?.date_of_birth
    ? (() => {
        const d = dayjs(portfolioPersonal.date_of_birth);
        const buddhistYear = d.year() + 543;
        return `${d.format("D MMMM")} ${buddhistYear} (${dayjs().diff(portfolioPersonal.date_of_birth, "year")} ปี)`;
      })()
    : "-";

  useEffect(() => {
    console.log("user : ", user);
    console.log("portfolioPersonal : ", portfolioPersonal);
  }, [user, portfolioPersonal]);

  return (
    <WhiteContainer>
      <>
        <TitleWithEditIcon title="ข้อมูลส่วนตัว" onEdit={onEdit} />

        <div className="flex flex-col md:flex-row gap-6 md:gap-16 items-center md:items-start text-left">
          <div className="w-32 h-32 md:w-40 md:h-40 md:min-w-[150px] aspect-square rounded-full overflow-hidden shadow-sm border border-gray-100 flex-shrink-0">
            <img
              src={
                imageUrl
                  ? getFile(imageUrl)
                  : "/assets/user/fallback-user.png"
              }
              alt="user image"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="w-full flex-1 flex flex-col gap-6 md:gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <DetailWithSideLabel
                label="คำนำหน้าชื่อ"
                value={user?.title_th || "-"}
              />
              <DetailWithSideLabel
                label="ชื่อ-นามสกุล (ไทย)"
                value={fullNameTh}
              />
              <DetailWithSideLabel
                label="ชื่อ-นามสกุล (อังกฤษ)"
                value={fullNameEn}
              />
              <DetailWithSideLabel label="วันเกิด" value={birthDate} />
              <DetailWithSideLabel
                label="สัญชาติ"
                value={portfolioPersonal?.nationality || "-"}
              />
              <DetailWithSideLabel
                label="เชื้อชาติ"
                value={portfolioPersonal?.race || "-"}
              />
            </div>

            <div className="h-px bg-gray-100" />

            <div className="flex flex-col gap-4">
              <h3 className="body-bold-3 text-primary-black">
                ช่องทางการติดต่อ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <DetailWithSideLabel
                  label="เบอร์โทร"
                  value={portfolioPersonal?.phone_number || "-"}
                />
                <DetailWithSideLabel
                  label="e-mail"
                  value={portfolioPersonal?.email || "-"}
                />
                <DetailWithSideLabel
                  label="github"
                  value={portfolioPersonal?.github || "-"}
                />
                <DetailWithSideLabel
                  label="LinkedIn"
                  value={portfolioPersonal?.linkedin || "-"}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    </WhiteContainer>
  );
};

//-------------------------------------

type DetailWithSideLabelProps = {
  label: string;
  value: string;
};

const DetailWithSideLabel = (props: DetailWithSideLabelProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-primary-orange caption-bold">{props.label}:</div>
      <div className="caption-regular break-all">{props.value}</div>
    </div>
  );
};
export default PersonalDetailsSection;
