import type { URLDetail } from "../../../../types/attachment-type.type";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";

type Props = {
  linkDetail: URLDetail;
};

const AttachmentLinkCard = (props: Props) => {
  return (
    <a
      href={props.linkDetail.url}
      target="_blank"
      rel="noopener noreferrer"
      className="h-fit 2xl:max-w-74 max-w-64 2xl:p-5 p-2 rounded-2xl border border-light-grey flex 2xl:gap-4 gap-2 cursor-pointer ease-in-out duration-100 hover:text-secondary-blue"
    >
      <div className="bg-secondary-blue 2xl:p-[10px] p-3 h-fit rounded-sm caption-bold text-white">
        URL
      </div>

      <div className="overflow-hidden">
        <div className="caption-bold truncate">{props.linkDetail.title}</div>
        <div>{convertDateToThaiFormat(props.linkDetail.uploaded_at)}</div>
      </div>
    </a>
  );
};

export default AttachmentLinkCard;
