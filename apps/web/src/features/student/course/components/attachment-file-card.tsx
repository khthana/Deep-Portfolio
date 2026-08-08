import type { FileDetail } from "../../../../types/attachment-type.type";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";
import { getFile } from "../../../../utils/get-file";

type Props = {
  fileDetail: FileDetail;
};

const AttachmentFileCard = (props: Props) => {
  return (
    <a
      href={getFile(props.fileDetail.file_path)}
      // target="_blank"
      // rel="noopener noreferrer"
      download={props.fileDetail.title}
      className="h-fit 2xl:max-w-74 max-w-64 2xl:p-5 p-2 rounded-2xl border border-light-grey flex 2xl:gap-4 gap-2 cursor-pointer ease-in-out duration-100 hover:text-secondary-blue"
    >
      <div className="bg-secondary-blue 2xl:p-[10px] p-3 h-fit rounded-sm caption-bold text-white">
        {props.fileDetail.file_type}
      </div>

      <div className="overflow-hidden">
        <div className="caption-bold truncate">{props.fileDetail.title}</div>
        <div>{convertDateToThaiFormat(props.fileDetail.uploaded_at)}</div>
      </div>
    </a>
  );
};

export default AttachmentFileCard;
