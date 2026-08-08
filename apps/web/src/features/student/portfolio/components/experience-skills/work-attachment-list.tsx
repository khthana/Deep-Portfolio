import { Spin, Image as AntImage } from "antd";
import { getFile } from "../../../../../utils/get-file";
import {
  FilePdfOutlined,
  PlayCircleOutlined,
  LinkOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { getStudentActivityAttachments } from "../../../../../services/student.service";

type Attachment = {
  fileType: "image" | "video" | "pdf" | "link" | "file";
  fileName: string;
  url: string;
};

type Props = {
  activityId: number;
};

const WorkAttachmentList = ({ activityId }: Props) => {
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    if (!activityId) {
      setAttachments([]);
      return;
    }

    const fetchAttachments = async () => {
      setLoading(true);
      try {
        const res = await getStudentActivityAttachments(activityId);
        if (res.success) {
          const mapped = (res.data || []).map(
            (a: { original_filename: string; url: string }) => {
              const ext = a.original_filename.split(".").pop()?.toLowerCase();
              const isImg = [
                "jpg",
                "jpeg",
                "png",
                "gif",
                "webp",
                "svg",
              ].includes(ext || "");
              return {
                fileType: isImg
                  ? "image"
                  : ext === "mp4" || ext === "mov"
                    ? "video"
                    : ext === "pdf"
                      ? "pdf"
                      : "file",
                fileName: a.original_filename,
                url: a.url
                  ? a.url.startsWith("http")
                    ? a.url
                    : getFile(a.url)
                  : "",
              };
            },
          );
          setAttachments(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch attachments", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, [activityId]);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Spin size="small" />
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="py-4 text-center text-gray-400 text-xs italic">
        ไม่มีไฟล์แนบสำหรับชิ้นงานนี้
      </div>
    );
  }

  const images = attachments.filter((a) => a.fileType === "image");
  const files = attachments.filter((a) => a.fileType !== "image");

  return (
    <div className="space-y-4">
      {/* Photos Section */}
      {images.length > 0 && (
        <div>
          <AntImage.PreviewGroup
            preview={{
              zIndex: 10000,
            }}
          >
            <div className="flex flex-wrap gap-2 py-1">
              {images.map((image, idx) => (
                <AntImage
                  key={idx}
                  src={image.url}
                  alt={image.fileName}
                  width={80}
                  height={80}
                  className="object-cover rounded-lg shadow-sm border border-gray-100"
                  preview={{
                    mask: <div className="text-white text-[10px]">ดูรูป</div>,
                    zIndex: 10000,
                  }}
                />
              ))}
            </div>
          </AntImage.PreviewGroup>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((attachment, index) => (
            <a
              key={index}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 pl-3 pr-4 py-2 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow cursor-pointer text-decoration-none group"
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform"
                style={{
                  backgroundColor: `rgba(14, 48, 92, 0.1)`,
                }}
              >
                {attachment.fileType === "video" && (
                  <PlayCircleOutlined
                    style={{ color: "#0e305cff", fontSize: 16 }}
                  />
                )}
                {attachment.fileType === "pdf" && (
                  <FilePdfOutlined
                    style={{ color: "#0e305cff", fontSize: 16 }}
                  />
                )}
                {attachment.fileType === "link" && (
                  <LinkOutlined style={{ color: "#0e305cff", fontSize: 16 }} />
                )}
                {attachment.fileType === "file" && (
                  <FileOutlined style={{ color: "#0e305cff", fontSize: 16 }} />
                )}
              </div>
              <div className="flex flex-col">
                <span className="caption-bold text-[11px] font-semibold truncate max-w-[120px] text-primary-black">
                  {attachment.fileName}
                </span>
                <span className="text-[9px] text-gray-400 uppercase">
                  {attachment.fileType}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkAttachmentList;
