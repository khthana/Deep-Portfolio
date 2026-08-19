import { generateHTML, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { convertDateToThaiFormat } from "../../../../utils/format-thai-date";
import AttachmentFileCard from "./attachment-file-card";
import AttachmentLinkCard from "./attachment-link-card";
import WhiteContainer from "../../../../components/container/white-container";
import type { AnnouncementDetailResp } from "@deep-portfolio/api-types";

type Props = {
  announcement: AnnouncementDetailResp;
};

const AnnouncementCard = (props: Props) => {
  // The API does not know what is in this column and says so — `unknown` off
  // the wire (#68). The editor at the other end of the noticeboard is the only
  // thing that ever wrote it, so this is the one place that says what it is,
  // the same as the two classwork detail mappers.
  const html = generateHTML(props.announcement.content as JSONContent, [
    StarterKit,
  ]);

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
