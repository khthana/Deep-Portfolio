import { useState } from "react";
import { BgColorsOutlined, CloseOutlined } from "@ant-design/icons";
// import type { PortfolioTheme } from "./types";

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  onClose?: () => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor,
  onColorChange,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <div className="fixed bottom-8 right-8 z-[10000]">
      {/* Color Picker Button */}
      <button
        onClick={handleToggle}
        className="bg-white shadow-lg rounded-full p-4 hover:shadow-xl transition-all duration-300 flex items-center gap-3 border-2 border-gray-200"
        title="Customize Theme Color"
      >
        <BgColorsOutlined className="text-2xl" style={{ color: currentColor }} />
        <span className="font-medium text-gray-700 hidden sm:inline">
          เปลี่ยนสีธีม
        </span>
      </button>

      {/* Color Picker Panel */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 bg-white rounded-2xl shadow-2xl p-6 w-80 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-800">เลือกสีธีม</h3>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <CloseOutlined className="text-xl" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สีหลัก (Primary Color)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={currentColor}
                  onChange={(e) => {
                    // Validate hex color format
                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                      onColorChange(e.target.value);
                    }
                  }}
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500"
                  placeholder="#1a2a5d"
                />
              </div>
            </div>

            {/* Preset Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สีที่แนะนำ
              </label>
              <div className="grid grid-cols-6 gap-2">
                {[
                  "#1a2a5d", // Default blue
                  "#f4632a", // Orange
                  "#3068d9", // Bright blue
                  "#3b8b5c", // Green
                  "#e02929", // Red
                  "#f1bc41", // Yellow
                  "#8b5cf6", // Purple
                  "#ec4899", // Pink
                  "#14b8a6", // Teal
                  "#f59e0b", // Amber
                  "#6366f1", // Indigo
                  "#10b981", // Emerald
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => onColorChange(color)}
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
