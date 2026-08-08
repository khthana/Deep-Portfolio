import React from "react";
import { ModernBlueTemplate } from "../../components/e-portfolio-template/theme-modern-blue";
import type {
  PortfolioData,
  PortfolioTheme,
} from "../../components/e-portfolio-template/types";
import { usePublicPortfolio } from "../../hooks/use-public-portfolio";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";

const PublicPortfolioPage = () => {
  const { shareToken } = useParams();
  const {
    data: portfolioData,
    loading,
    error,
  } = usePublicPortfolio(shareToken || "");

  const antIcon = (
    <LoadingOutlined
      style={{ fontSize: 48, color: "var(--primary-orange)" }}
      spin
    />
  );

  if (loading) {
    return (
      <div
        className="min-h-screen font-sans bg-gray-50 flex flex-col items-center justify-center w-full"
        style={{ color: "var(--primary-orange)" }}
      >
        <Spin indicator={antIcon} size="large" />
        <div
          className="mt-4 text-lg font-medium"
          style={{ color: "var(--primary-orange)" }}
        >
          กำลังโหลด e-Portfolio. . .
        </div>
      </div>
    );
  }

  if (error || !portfolioData) {
    const isExpired = (error as any)?.response?.status === 410;

    return (
      <div className="min-h-screen font-sans bg-gray-50 flex flex-col items-center justify-center w-full p-4">
        <div className="max-w-md w-full text-center bg-white p-10 rounded-3xl shadow-2xl border border-gray-100">
          <div className="mb-6">
            <div
              className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center ${isExpired ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}
            >
              {isExpired ? (
                <span className="text-4xl text-amber-600">⌛</span>
              ) : (
                <span className="text-4xl">🚫</span>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {isExpired ? "ลิงก์แชร์หมดอายุแล้ว" : "ไม่พบ Portfolio"}
          </h2>
          <p className="text-gray-500 text-base leading-relaxed mb-8">
            {isExpired
              ? "ลิงก์เข้าชม e-Portfolio นี้หมดอายุการใช้งานแล้ว กรุณาติดต่อเจ้าของเพื่อขอลิงก์ใหม่"
              : error?.message ||
                "ไม่พบหน้าที่คุณต้องการ หรือลิงก์นี้อาจจะถูกลบไปแล้ว"}
          </p>
          <div className="pt-2">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-widest">
              DEEP Platform
            </div>
          </div>
        </div>
      </div>
    );
  }

  type TemplateComponentType = React.FC<{
    data: PortfolioData;
    theme?: PortfolioTheme;
    isReadOnly?: boolean;
  }>;

  let TemplateComponent: TemplateComponentType;

  switch (portfolioData.templateName) {
    case "Modern Blue":
      TemplateComponent = ModernBlueTemplate;
      break;
    default:
      TemplateComponent = ModernBlueTemplate;
  }

  const appliedTheme: PortfolioTheme = {
    primaryColor: portfolioData.templateColor || "#1e3a8a",
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="flex justify-center w-full py-0 sm:py-8">
        <div
          className="w-full max-w-[1440px] bg-white sm:rounded-2xl sm:shadow-2xl overflow-hidden relative"
          style={{
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* Subtle decorative background accent at the top */}
          <div
            className="absolute top-0 left-0 w-full h-64 pointer-events-none opacity-10"
            style={{
              background: `linear-gradient(to right bottom, ${appliedTheme.primaryColor}, transparent)`,
              maskImage: "linear-gradient(to bottom, black, transparent)",
            }}
          />

          <div className="relative z-10">
            <TemplateComponent
              data={portfolioData}
              theme={appliedTheme}
              isReadOnly={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicPortfolioPage;
