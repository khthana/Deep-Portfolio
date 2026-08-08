import React, { useState } from "react";
import { Modal, DatePicker, Button, message, Input } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");
import {
  ShareAltOutlined,
  CopyOutlined,
  LinkOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { generateShareLink } from "../../../../../services/portfolio.service";

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
  portfolioName: string;
  initialExpiresAt?: string | Date | null;
  onRefresh?: () => void;
}

const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  portfolioId,
  portfolioName,
  initialExpiresAt,
  onRefresh,
}) => {
  const [generating, setGenerating] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(
    initialExpiresAt
      ? dayjs(initialExpiresAt).toISOString()
      : dayjs().add(7, "day").toISOString(),
  );

  React.useEffect(() => {
    if (isOpen) {
      setExpiresAt(
        initialExpiresAt
          ? dayjs(initialExpiresAt).toISOString()
          : dayjs().add(7, "day").toISOString(),
      );
      setShareToken(null);
    }
  }, [isOpen, initialExpiresAt]);
  const [messageApi, contextHolder] = message.useMessage();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateShareLink(portfolioId, expiresAt);
      if (res.success) {
        const token = res.data.publicShareToken;
        setShareToken(token);
        const fullUrl = `${window.location.origin}/p/${token}`;
        navigator.clipboard.writeText(fullUrl);
        messageApi.success("สร้างลิงก์แชร์และคัดลอกลงคลิปบอร์ดเรียบร้อยแล้ว");
        if (onRefresh) onRefresh();
      } else {
        messageApi.error(res.message || "เกิดข้อผิดพลาดในการสร้างลิงก์");
      }
    } catch {
      messageApi.error("ไม่สามารถสร้างลิงก์ได้ กรุณาลองอีกครั้ง");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      messageApi.success("คัดลอกลิงก์แล้ว");
    }
  };

  const shareUrl = shareToken
    ? `${window.location.origin}/p/${shareToken}`
    : null;

  const handleClose = () => {
    setShareToken(null);
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <ShareAltOutlined className="text-primary-orange" />
          <span>แชร์ e-Portfolio: {portfolioName}</span>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      centered
      width={400}
      className="share-link-modal"
    >
      {contextHolder}
      <div className="py-4 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">เลือกวัน</label>
          <DatePicker
            value={expiresAt ? dayjs(expiresAt) : null}
            onChange={(date) => setExpiresAt(date ? date.toISOString() : null)}
            disabledDate={(current) => {
              return current && current < dayjs().startOf("day");
            }}
            className="w-full h-10 rounded-lg"
            placeholder="ไม่มีวันหมดอายุ"
            format="DD/MM/YYYY"
            allowClear
          />
        </div>

        <Button
          type="primary"
          onClick={handleGenerate}
          loading={generating}
          disabled={generating}
          className="w-full h-11 rounded-xl bg-primary-orange hover:bg-primary-orange/90 border-none font-bold"
        >
          {shareUrl ? "สร้างลิงก์ใหม่" : "สร้างลิงก์สำหรับแชร์"}
        </Button>

        {shareUrl && (
          <Button
            icon={<ExportOutlined />}
            onClick={() => window.open(shareUrl, "_blank")}
            className="w-full h-11 rounded-xl border-gray-200 hover:border-primary-orange hover:text-primary-orange font-bold flex items-center justify-center gap-2"
          >
            เปิดลิงก์สำหรับเข้าชม
          </Button>
        )}

        {shareUrl && (
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                ลิงก์ของคุณ
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                prefix={<LinkOutlined className="text-gray-400" />}
                value={shareUrl}
                readOnly
                className="rounded-lg h-9 text-xs bg-white border-gray-200"
              />
              <Button
                icon={<CopyOutlined />}
                onClick={copyToClipboard}
                className="rounded-lg h-9 border-gray-200 hover:border-primary-orange hover:text-primary-orange"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareLinkModal;
