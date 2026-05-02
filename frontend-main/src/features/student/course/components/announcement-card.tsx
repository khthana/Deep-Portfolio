import { generateHTML } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";
import AttachmentFileCard from "./attachment-file-card";
import AttachmentLinkCard from "./attachment-link-card";
import WhiteContainer from "../../../../components/container/white-container";
import type { AnnouncementDetailResp } from "../../../../types/course-type.type";

type Props = {
  announcement: AnnouncementDetailResp;
};

const AnnouncementCard = (props: Props) => {
  const html = generateHTML(props.announcement.content, [StarterKit]);

  return (
    <WhiteContainer>
      <div className="pb-5 border-b border-light-grey flex justify-between items-center w-full">
        <div className="body-bold-2">{props.announcement.title}</div>
        <div>{convertDateToThaiFormat(props.announcement.updated_at)}</div>
      </div>
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="flex gap-2 flex-wrap">
        {props.announcement.attachments &&
          props.announcement.attachments.file.map((file) => (
            <AttachmentFileCard key={file.attachment_id} fileDetail={file} />
          ))}

        {props.announcement.attachments &&
          props.announcement.attachments.url.map((url) => (
            <AttachmentLinkCard key={url.attachment_id} linkDetail={url} />
          ))}
      </div>
    </WhiteContainer>
  );
};

export default AnnouncementCard;
