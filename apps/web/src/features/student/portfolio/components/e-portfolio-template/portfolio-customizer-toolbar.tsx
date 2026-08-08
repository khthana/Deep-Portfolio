import React, { useState, useRef, useEffect } from "react";
import { message } from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  BgColorsOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ShareAltOutlined,
  CopyOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { paths } from "../../../../../routes/paths.config";
import {
  updatePortfolio,
  generateShareLink,
} from "../../../../../services/portfolio.service";
import type { CreatePortfolioReq } from "../../../../../services/portfolio.service";
import { Select, DatePicker } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

const PRESET_COLORS = [
  { color: "#1a2a5d", label: "Navy Blue" },
  { color: "#f4632a", label: "Orange" },
  { color: "#3068d9", label: "Royal Blue" },
  { color: "#3b8b5c", label: "Forest Green" },
  { color: "#c0392b", label: "Crimson" },
  { color: "#6d4c41", label: "Brown" },
  { color: "#8b5cf6", label: "Purple" },
  { color: "#ec4899", label: "Pink" },
  { color: "#0891b2", label: "Cyan" },
  { color: "#d97706", label: "Amber" },
  { color: "#4f46e5", label: "Indigo" },
  { color: "#059669", label: "Emerald" },
];

interface PortfolioCustomizerToolbarProps {
  portfolioId: string;
  currentColor: string;
  onColorChange: (color: string) => void;
  onSaveSuccess?: () => void;
}

export const PortfolioCustomizerToolbar: React.FC<
  PortfolioCustomizerToolbarProps
> = ({ portfolioId, currentColor, onColorChange, onSaveSuccess }) => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [saving, setSaving] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [hexInput, setHexInput] = useState(currentColor);
  const [generating, setGenerating] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(
    dayjs().add(7, "day").toISOString(),
  );
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync hex input when color changes externally
  useEffect(() => {
    setHexInput(currentColor);
  }, [currentColor]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsPanelOpen(false);
      }
    };
    if (isPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPanelOpen]);

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onColorChange(val);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updatePortfolio(portfolioId, {
        template_color: currentColor,
      } as Partial<CreatePortfolioReq>);
      if (res.success) {
        messageApi.success("บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว");
        onSaveSuccess?.();
      } else {
        messageApi.error(res.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch {
      messageApi.error("ไม่สามารถบันทึกได้ กรุณาลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  const handleExit = () => {
    navigate(paths.student.portfolio.ePortfolio.list);
  };
  const handleGenerateLink = async () => {
    setGenerating(true);
    try {
      const res = await generateShareLink(portfolioId, expiresAt);
      if (res.success) {
        const token = res.data.publicShareToken;
        setShareToken(token);
        const fullUrl = `${window.location.origin}/p/${token}`;
        navigator.clipboard.writeText(fullUrl);
        messageApi.success("สร้างลิงก์แชร์และคัดลอกลงคลิปบอร์ดเรียบร้อยแล้ว");
      } else {
        messageApi.error(res.message || "เกิดข้อผิดพลาดในการสร้างลิงก์");
      }
    } catch {
      messageApi.error("ไม่สามารถสร้างลิงก์ได้ กรุณาลองอีกครั้ง");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    messageApi.success("คัดลอกลิงก์แล้ว");
  };

  const shareUrl = shareToken
    ? `${window.location.origin}/p/${shareToken}`
    : null;

  return (
    <>
      {contextHolder}

      {/* ─── DESKTOP TOOLBAR (hidden on mobile) ─── */}
      <div
        ref={panelRef}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[100000] hidden md:flex flex-col items-end"
        style={{ gap: 0 }}
      >
        {/* Main pull-tab trigger */}
        <button
          onClick={() => setIsPanelOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-4 rounded-l-2xl shadow-2xl text-white font-semibold text-sm transition-all duration-300 hover:pr-5"
          style={{
            background: `linear-gradient(135deg, ${currentColor}ee, ${currentColor})`,
            writingMode: "vertical-rl",
            letterSpacing: "0.08em",
          }}
          title="เปิด/ปิดแถบปรับแต่ง"
        >
          <BgColorsOutlined
            style={{ fontSize: 18, writingMode: "initial", rotate: "0deg" }}
          />
          <span style={{ transform: "rotate(180deg)" }}>ปรับแต่ง</span>
        </button>

        {/* Expanded panel */}
        <div
          className={`
            absolute right-0 top-1/2 -translate-y-1/2 mr-10
            bg-white rounded-2xl shadow-2xl border border-gray-100
            transition-all duration-300 origin-right overflow-hidden
            ${isPanelOpen ? "opacity-100 scale-x-100 pointer-events-auto" : "opacity-0 scale-x-0 pointer-events-none"}
          `}
          style={{ width: 280, transformOrigin: "right center" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-t-2xl"
            style={{
              background: `linear-gradient(135deg, ${currentColor}22, ${currentColor}11)`,
            }}
          >
            <div className="flex items-center gap-2">
              {/* Preview Mode badge */}
              <span
                className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: currentColor }}
              >
                <EyeOutlined />
                Preview Mode
              </span>
            </div>
            <button
              onClick={() => setIsPanelOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <CloseOutlined />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Current color display + hex input */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                สีหลัก (Primary Color)
              </label>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 flex-shrink-0 shadow-inner"
                  style={{ backgroundColor: currentColor }}
                />
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={hexInput}
                    onChange={(e) => handleHexChange(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:border-blue-400 transition-colors uppercase"
                    placeholder="#1a2a5d"
                    maxLength={7}
                  />
                  {/^#[0-9A-Fa-f]{6}$/.test(hexInput) && (
                    <CheckOutlined className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-xs" />
                  )}
                </div>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => {
                    onColorChange(e.target.value);
                    setHexInput(e.target.value);
                  }}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 cursor-pointer flex-shrink-0"
                  title="เลือกสีจาก Color Picker"
                />
              </div>
            </div>

            {/* Preset swatches */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                สีที่แนะนำ
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map(({ color, label }) => (
                  <button
                    key={color}
                    onClick={() => {
                      onColorChange(color);
                      setHexInput(color);
                    }}
                    className="relative w-9 h-9 rounded-xl border-2 transition-all duration-200 hover:scale-110 hover:shadow-md focus:outline-none"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        currentColor === color ? "#1f2937" : "transparent",
                      boxShadow:
                        currentColor === color
                          ? `0 0 0 2px white, 0 0 0 4px ${color}`
                          : undefined,
                    }}
                    title={label}
                  >
                    {currentColor === color && (
                      <CheckOutlined
                        className="absolute inset-0 flex items-center justify-center text-white text-xs"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Share Link Section */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                แชร์ลิงก์ e-Portfolio
              </label>
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] text-gray-400">เลือกวัน</span>
                  <DatePicker
                    value={expiresAt ? dayjs(expiresAt) : null}
                    onChange={(date) =>
                      setExpiresAt(date ? date.toISOString() : null)
                    }
                    className="w-full"
                    placeholder="ไม่มีวันหมดอายุ"
                    format="DD/MM/YYYY"
                    allowClear
                  />
                </div>

                <button
                  onClick={handleGenerateLink}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-gray-700 font-semibold text-xs border-2 border-gray-100 hover:bg-gray-50 active:scale-95 transition-all duration-200"
                >
                  {generating ? (
                    <span className="animate-spin rounded-full border-2 border-gray-400 border-t-transparent w-3 h-3" />
                  ) : (
                    <ShareAltOutlined />
                  )}
                  {shareUrl ? "สร้างลิงก์ใหม่" : "สร้างลิงก์สำหรับแชร์"}
                </button>

                {shareUrl && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <LinkOutlined className="text-gray-400 flex-shrink-0" />
                        <span className="text-[11px] text-gray-500 truncate">
                          {shareUrl}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(shareUrl)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                        title="คัดลอกลิงก์"
                      >
                        <CopyOutlined className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                style={{ backgroundColor: currentColor }}
              >
                {saving ? (
                  <span className="animate-spin rounded-full border-2 border-white border-t-transparent w-4 h-4" />
                ) : (
                  <SaveOutlined />
                )}
                บันทึกการเปลี่ยนแปลง
              </button>

              <button
                onClick={handleExit}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-gray-600 font-semibold text-sm border-2 border-gray-200 hover:bg-gray-50 active:scale-95 transition-all duration-200"
              >
                <ArrowLeftOutlined />
                กลับหน้าหลัก
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MOBILE TOOLBAR (bottom bar, visible only on mobile) ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-[100000] md:hidden">
        {/* Color panel (slides up) */}
        <div
          className={`bg-white border-t border-gray-200 shadow-2xl transition-all duration-300 ${
            isPanelOpen
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="p-4 space-y-3">
            {/* Badge */}
            <div className="flex items-center justify-between">
              <span
                className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: currentColor }}
              >
                <EyeOutlined />
                Preview Mode
              </span>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <CloseOutlined />
              </button>
            </div>

            {/* Hex + color picker */}
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex-shrink-0"
                style={{ backgroundColor: currentColor }}
              />
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:border-blue-400 uppercase"
                placeholder="#1a2a5d"
                maxLength={7}
              />
              <input
                type="color"
                value={currentColor}
                onChange={(e) => {
                  onColorChange(e.target.value);
                  setHexInput(e.target.value);
                }}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 cursor-pointer flex-shrink-0"
              />
            </div>

            {/* Presets */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {PRESET_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  onClick={() => {
                    onColorChange(color);
                    setHexInput(color);
                  }}
                  className="w-9 h-9 rounded-xl border-2 flex-shrink-0 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor:
                      currentColor === color ? "#1f2937" : "transparent",
                  }}
                  title={label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom action bar (always visible on mobile) */}
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ backgroundColor: currentColor }}
        >
          {/* Preview mode badge */}
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-white bg-opacity-20 text-white">
            <EyeOutlined />
            Preview
          </span>

          {/* Color toggle */}
          <button
            onClick={() => setIsPanelOpen((v) => !v)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white bg-opacity-20 text-white text-xs font-semibold transition-all hover:bg-opacity-30"
          >
            <BgColorsOutlined />
            <div
              className="w-4 h-4 rounded-full border border-white"
              style={{ backgroundColor: currentColor }}
            />
          </button>

          <div className="flex-1" />

          {/* Exit */}
          <button
            onClick={handleExit}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white bg-opacity-20 text-white text-xs font-semibold hover:bg-opacity-30 transition-all"
          >
            <ArrowLeftOutlined />
            กลับ
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white text-xs font-bold transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-60 shadow-md"
            style={{ color: currentColor }}
          >
            {saving ? (
              <span className="animate-spin rounded-full border-2 border-current border-t-transparent w-3 h-3" />
            ) : (
              <SaveOutlined />
            )}
            บันทึก
          </button>
        </div>
      </div>
    </>
  );
};
