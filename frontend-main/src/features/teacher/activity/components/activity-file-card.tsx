import type {
  FileDetail,
  URLDetail,
} from "../../../../types/attachment-type.type";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";
import { AttachmentType } from "../../announcement/types/announement-type";

type Props = {
  handleClassworkFileCardOnClick: (
    attachment_id: number,
    path: string,
    type: AttachmentType,
  ) => void;
  fileData?: FileDetail;
  urlData?: URLDetail;
  isSelected: number;

  color?: "blue" | "orange";
};

const ActivityFileCard = (props: Props) => {
  return (
    <>
      {props.fileData && (
        <div
          className={`2xl:p-6 p-3 caption-regular rounded-md flex justify-between items-center cursor-pointer truncate ${
            props.isSelected === props.fileData.attachment_id
              ? props.color === "blue"
                ? "bg-secondary-blue text-white"
                : "bg-primary-orange text-white"
              : "bg-background text-primary-black "
          }`}
          onClick={() =>
            props.fileData &&
            props.handleClassworkFileCardOnClick(
              props.fileData.attachment_id,
              props.fileData.file_path,
              AttachmentType.FILE,
            )
          }
        >
          <div className="truncate">{props.fileData.title}</div>
          <div className="text-xs 2xl:caption-regular">
            {convertDateToThaiFormat(props.fileData.uploaded_at)}
          </div>
        </div>
      )}

      {props.urlData && (
        <div
          className={`2xl:p-6 p-3 caption-regular rounded-md flex justify-between items-center cursor-pointer truncate ${
            props.isSelected === props.urlData.attachment_id
              ? props.color === "blue"
                ? "bg-secondary-blue text-white"
                : "bg-primary-orange text-white"
              : "bg-background text-primary-black "
          }`}
          onClick={() =>
            props.urlData &&
            props.handleClassworkFileCardOnClick(
              props.urlData.attachment_id,
              props.urlData.url,
              AttachmentType.LINK,
            )
          }
        >
          <div className="truncate">{props.urlData.title}</div>
          <div className="text-xs 2xl:caption-regular">
            {convertDateToThaiFormat(props.urlData.uploaded_at)}
          </div>
        </div>
      )}
    </>
  );
};

export default ActivityFileCard;
