import React from "react";
import { ModernBlueTemplate } from "../../components/e-portfolio-template/theme-modern-blue";
import type {
  PortfolioData,
  PortfolioTheme,
} from "../../components/e-portfolio-template/types";
import { usePortfolio } from "../../hooks/use-portfolio";

import { Spin, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

import { useParams, useNavigate } from "react-router-dom";
import { paths } from "../../../../../routes/paths.config";

const StudentEPortfolioViewPage = () => {
  const navigate = useNavigate();
  const { portfolioId } = useParams();
  const {
    data: portfolioData,
    loading,
    error,
  } = usePortfolio(portfolioId || "portfolio-1");

  const [messageApi, contextHolder] = message.useMessage();

  React.useEffect(() => {
    if (error || (!loading && !portfolioData)) {
      messageApi.error("ไม่สามารถเปิดดูได้ เนื่องจากข้อมูลไม่ครบถ้วน");
      setTimeout(() => {
        navigate(paths.student.portfolio.ePortfolio.list);
      }, 1000);
    }
  }, [error, portfolioData, loading, navigate, messageApi]);

  const antIcon = (
    <LoadingOutlined
      style={{ fontSize: 48, color: "var(--primary-orange)" }}
      spin
    />
  );

  if (loading) {
    return (
      <div
        className="min-h-screen font-sans bg-port-bg"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--primary-orange)",
        }}
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
    return (
      <>
        {contextHolder}
        <div className="min-h-screen font-sans bg-gray-50 flex flex-col items-center justify-center w-full p-4">
          <Spin indicator={antIcon} size="large" />
        </div>
      </>
    );
  }

  type TemplateComponentType = React.FC<{
    data: PortfolioData;
    theme?: PortfolioTheme;
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
    primaryColor: portfolioData.templateColor,
  };

  return (
    <>
      <TemplateComponent data={portfolioData} theme={appliedTheme} />
    </>
  );
};

export default StudentEPortfolioViewPage;
