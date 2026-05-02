import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { ThemeProvider } from "../../components/e-portfolio-template/theme-context";
import type {
  PortfolioTheme,
  PersonalInfo,
  Certificate,
} from "../../components/e-portfolio-template/types";
import { Header } from "../../components/e-portfolio-template/theme-modern-blue/header";
import { Footer } from "../../components/e-portfolio-template/theme-modern-blue/footer";
import { ImageSlider } from "../../components/common/image-slider";
import { MOCK_PORTFOLIO_DATA } from "../../data/mock-portfolio-data";
import { getPortfolioCertificateById } from "../../../../../services/portfolio-certificate.service";
import { getFile } from "../../../../../utils/get-file";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

import { paths } from "../../../../../routes/paths.config";
import { usePublicPortfolio } from "../../hooks/use-public-portfolio";
import { cleanNullStr } from "../../../../../utils/clean-null-str";

const StudentCertificateDetailPage: React.FC = () => {
  const { certificateId, portfolioId, shareToken } = useParams<{
    certificateId: string;
    portfolioId?: string;
    shareToken?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  const isPublic = !!shareToken;
  const publicPort = usePublicPortfolio(shareToken || "", !isPublic);

  const theme =
    (location.state?.theme as PortfolioTheme) ||
    ({
      primaryColor: MOCK_PORTFOLIO_DATA.templateColor,
      textMainColor: "#000000",
      textSubColor: "#666666",
      backgroundColor: "#ffffff",
      cardColor: "#ffffff",
    } as PortfolioTheme);

  const personalInfo =
    (location.state?.personalInfo as PersonalInfo) ||
    MOCK_PORTFOLIO_DATA.personalInfo;

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!certificateId) return;

      if (isPublic) {
        if (!publicPort.loading) {
          if (publicPort.data) {
            const found = publicPort.data.certificates.find(
              (c) => c.id === certificateId,
            );
            setCertificate(found || null);
          }
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const response = await getPortfolioCertificateById(
          Number(certificateId),
        );

        if (response.success && response.data) {
          const c = cleanNullStr(response.data);
          const mappedCertificate: Certificate = {
            id: c.id.toString(),
            name: c.name || "",
            organizer: c.organize || "",
            date: c.date
              ? new Date(c.date).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "",
            description: c.description || "",
            attachments: c.attachments.map((a: any) => {
              const ext = a.original_filename?.split(".").pop()?.toLowerCase();
              const isImg = [
                "jpg",
                "jpeg",
                "png",
                "gif",
                "webp",
                "svg",
              ].includes(ext || "");
              return {
                id: a.attachment_id.toString(),
                fileName: a.original_filename || "",
                fileType: isImg ? "image" : "file",
                url: a.url
                  ? a.url.startsWith("http")
                    ? a.url
                    : getFile(a.url)
                  : undefined,
              };
            }),
          };
          setCertificate(mappedCertificate);
        }
      } catch (error) {
        console.error("Error fetching certificate:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId, isPublic, publicPort.data, publicPort.loading]);

  const handleBackClick = () => {
    if (isPublic && shareToken) {
      navigate(`/p/${shareToken}#certificate-section`, {
        state: location.state,
      });
    } else if (portfolioId) {
      navigate(
        paths.student.portfolio.ePortfolio.view.replace(
          ":portfolioId",
          portfolioId,
        ) + "#certificate-section",
        { state: location.state },
      );
    } else {
      navigate(-1);
    }
  };

  const antIcon = (
    <LoadingOutlined
      style={{ fontSize: 48, color: "var(--port-primary)" }}
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
        }}
      >
        <Spin indicator={antIcon} size="large" />
        <div
          className="mt-4 text-lg font-medium"
          style={{ color: "var(--port-primary)" }}
        >
          กำลังโหลดข้อมูล...
        </div>
      </div>
    );
  }

  if (!certificate) {
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
        }}
      >
        <div className="max-w-4xl mx-auto px-8 py-12">
          <p style={{ color: "var(--port-primary)" }}>Certificate not found</p>
        </div>
      </div>
    );
  }

  const pageContent = (
    <div
      className="min-h-screen font-sans bg-port-bg flex flex-col"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <Header personalInfo={personalInfo} />

      <div className="flex-grow">
        <div className="flex flex-col w-full mx-auto pt-20 pb-48 max-w-7xl px-8">
          {certificate.attachments && certificate.attachments.length > 0 && (
            <div className="p-16 w-full flex justify-center">
              {certificate.attachments.filter((att) => att.fileType === "image")
                .length === 1 ? (
                <img
                  src={
                    certificate.attachments.find(
                      (att) => att.fileType === "image",
                    )?.url || ""
                  }
                  alt={
                    certificate.attachments.find(
                      (att) => att.fileType === "image",
                    )?.fileName
                  }
                  className="w-full h-auto object-contain rounded-lg shadow-lg"
                  style={{ maxHeight: "80vh" }}
                />
              ) : (
                <ImageSlider
                  images={certificate.attachments
                    .filter((att) => att.fileType === "image")
                    .map((att) => ({
                      id: att.id,
                      url: att.url || "",
                      alt: att.fileName,
                    }))}
                />
              )}
            </div>
          )}

          <div className="flex items-center gap-5">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <ArrowLeftOutlined
                className="text-xl"
                style={{ color: "var(--port-primary)" }}
              />
              <span
                className="caption-bold text-sm"
                style={{ color: "var(--port-primary)" }}
              >
                กลับหน้าหลัก
              </span>
            </button>
          </div>

          <div className="mb-8 mt-6">
            <h1 className="header-2" style={{ color: "var(--port-primary)" }}>
              {certificate.name}
            </h1>

            <div
              className="inline-block border rounded-full px-4 py-1 mb-4 mt-4"
              style={{ borderColor: "var(--port-primary)" }}
            >
              <span
                className="caption-bold"
                style={{ color: "var(--port-primary)" }}
              >
                {certificate.date}
              </span>
            </div>

            <div className="py-1">
              <span
                className="body-regular"
                style={{ color: "var(--port-text-sub)" }}
              >
                {certificate.organizer}
              </span>
            </div>

            {certificate.description && (
              <div className="py-1 mt-4">
                <span
                  className="caption-regular"
                  style={{ color: "var(--port-primary)" }}
                >
                  {certificate.description}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer contact={personalInfo?.contact} />
    </div>
  );

  if (theme) {
    return (
      <ThemeProvider theme={theme} wrapperClassName="theme-modern-blue">
        <div
          style={{
            backgroundColor: "var(--port-bg)",
            minHeight: "100vh",
          }}
        >
          {pageContent}
        </div>
      </ThemeProvider>
    );
  }

  return pageContent;
};

export default StudentCertificateDetailPage;
