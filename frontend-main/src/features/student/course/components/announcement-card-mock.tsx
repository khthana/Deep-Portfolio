import WhiteContainer from "../../../../components/container/white-container";
import type { AnnouncementDetail } from "../types/course-type";

type Props = {
  announcement: AnnouncementDetail;
  //   todo: change boolean to File
};

const AnnouncementCardMock = (props: Props) => {
  return (
    <WhiteContainer>
      <div className="pb-8 border-b border-light-grey flex justify-between items-center w-full">
        <div className="body-bold-2">{props.announcement.title}</div>
        <div>{props.announcement.dateTime}</div>
      </div>

      <div>{props.announcement.detail}</div>

      {props.announcement.file && (
        <div className="p-5 rounded-2xl border border-light-grey flex gap-4">
          <div className="bg-secondary-blue p-[10px] rounded-sm caption-bold text-white">
            PDF
          </div>

          <div>
            <div className="caption-bold">รายชื่อนศยังไม่ส่งงาน.pdf</div>
            <div>15 ก.ค. 2568, 23:59</div>
          </div>
        </div>
      )}
    </WhiteContainer>
  );
};

export default AnnouncementCardMock;
