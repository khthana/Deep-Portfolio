import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import type { PersonalInfo } from "../types";

interface HeaderProps {
  personalInfo: PersonalInfo;
}

export const Header: React.FC<HeaderProps> = ({ personalInfo }) => {
  const navigate = useNavigate();
  const { shareToken } = useParams<{ shareToken?: string }>();

  const isPublic = !!shareToken;

  return (
    <div
      className="fixed top-0 left-0 w-full z-50 text-white px-12 py-4 shadow-md flex items-center justify-between"
      style={{ backgroundColor: "var(--port-primary)" }}
    >
      <div className="flex items-center gap-4">
        {!isPublic && (
          <button
            onClick={() => navigate("/student/portfolio/e-portfolio")}
            className="flex items-center justify-center hover:opacity-80 transition-opacity"
            title="กลับไปที่รายการ e-Portfolio"
          >
            <ArrowLeftOutlined className="text-xl" />
          </button>
        )}
        <div className="font-bold text-xl">{personalInfo.fullName}</div>
      </div>
    </div>
  );
};

