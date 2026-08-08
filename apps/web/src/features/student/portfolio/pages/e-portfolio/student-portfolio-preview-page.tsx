import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { ModernBlueTemplate } from "../../components/e-portfolio-template/theme-modern-blue";
import { PortfolioCustomizerToolbar } from "../../components/e-portfolio-template/portfolio-customizer-toolbar";
import type {
  PortfolioData,
  PortfolioTheme,
} from "../../components/e-portfolio-template/types";
import { usePortfolio } from "../../hooks/use-portfolio";
import { paths } from "../../../../../routes/paths.config";

type TemplateComponentType = React.FC<{
  data: PortfolioData;
  theme?: PortfolioTheme;
  isReadOnly?: boolean;
}>;

const TEMPLATE_MAP: Record<string, TemplateComponentType> = {
  "Modern Blue": ModernBlueTemplate,
};

const StudentPortfolioPreviewPage: React.FC = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();

  const {
    data: portfolioData,
    loading,
    error,
  } = usePortfolio(portfolioId || "");

  const [messageApi, contextHolder] = message.useMessage();

  React.useEffect(() => {
    if (error || (!loading && !portfolioData)) {
      messageApi.error("ไม่สามารถเปิดดูได้ เนื่องจากข้อมูลไม่ครบถ้วน");
      setTimeout(() => {
        navigate(paths.student.portfolio.ePortfolio.list);
      }, 1000);
    }
  }, [error, portfolioData, loading, navigate, messageApi]);

  // Local preview color — initialized from portfolio data once loaded
  const [previewColor, setPreviewColor] = useState<string | null>(null);

  // Once data arrives and we haven't set a preview color yet, initialise from data
  React.useEffect(() => {
    if (portfolioData && previewColor === null) {
      setPreviewColor(portfolioData.templateColor || "#1a2a5d");
    }
  }, [portfolioData, previewColor]);

  // ───── Loading state ─────
  const antIcon = (
    <LoadingOutlined style={{ fontSize: 52, color: "#1a2a5d" }} spin />
  );

  if (loading || (portfolioData && previewColor === null)) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0f4ff 0%, #e8edf5 100%)",
        }}
      >
        <Spin indicator={antIcon} />
        <div
          style={{
            marginTop: 16,
            fontSize: 16,
            fontWeight: 600,
            color: "#1a2a5d",
          }}
        >
          กำลังโหลด e-Portfolio Preview...
        </div>
        <div style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>
          กรุณารอสักครู่
        </div>
      </div>
    );
  }

  // ───── Error state ─────
  if (error || !portfolioData) {
    return (
      <>
        {contextHolder}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#f9fafb",
          }}
        >
          <Spin indicator={antIcon} />
        </div>
      </>
    );
  }

  // ───── Resolve template ─────
  const TemplateComponent: TemplateComponentType =
    TEMPLATE_MAP[portfolioData.templateName] ?? ModernBlueTemplate;

  const resolvedColor =
    previewColor ?? portfolioData.templateColor ?? "#1a2a5d";
  const appliedTheme: PortfolioTheme = { primaryColor: resolvedColor };

  return (
    <>
      {/*
       * The ModernBlueTemplate renders its own position:fixed full-viewport wrapper
       * (zIndex 9999). We simply let it take over the screen here — no outer
       * wrapper needed. The toolbar sits above it at zIndex 100000.
       */}
      <TemplateComponent
        data={{
          ...portfolioData,
          // Inject the live preview color into templateColor so ThemeProvider
          // inside the template picks it up correctly.
          templateColor: resolvedColor,
        }}
        theme={appliedTheme}
        // false = internal mode → portfolioId param is used for detail navigation
        isReadOnly={false}
      />

      {/* Customizer toolbar — floats above the template */}
      {portfolioId && (
        <PortfolioCustomizerToolbar
          portfolioId={portfolioId}
          currentColor={resolvedColor}
          onColorChange={setPreviewColor}
        />
      )}
    </>
  );
};

export default StudentPortfolioPreviewPage;
