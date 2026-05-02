import React from "react";
import { BACKEND_API_URL } from "../../../../../lib/axios";
import { getFile } from "../../../../../utils/get-file";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeftOutlined,
  FilePdfOutlined,
  PlayCircleOutlined,
  PictureOutlined,
  LinkOutlined,
  FileOutlined,
} from "@ant-design/icons";

// ... existing code ...

import { ThemeProvider } from "../../components/e-portfolio-template/theme-context";
import type {
  PortfolioTheme,
  PersonalInfo,
} from "../../components/e-portfolio-template/types";
import { Header } from "../../components/e-portfolio-template/theme-modern-blue/header";
import { Footer } from "../../components/e-portfolio-template/theme-modern-blue/footer";
import { ImageSlider } from "../../components/common/image-slider";
import { MOCK_PORTFOLIO_DATA } from "../../data/mock-portfolio-data";

import { paths } from "../../../../../routes/paths.config";
import { cleanNullStr } from "../../../../../utils/clean-null-str";

import { getPortfolioTrainingById } from "../../../../../services/portfolio-training.service";
import type { Training } from "../../components/e-portfolio-template/types";
import { usePublicPortfolio } from "../../hooks/use-public-portfolio";

const StudentTrainingDetailPage: React.FC = () => {
  const { trainingId, portfolioId, shareToken } = useParams<{
    trainingId: string;
    portfolioId?: string;
    shareToken?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [training, setTraining] = React.useState<Training | null>(null);
  const [loading, setLoading] = React.useState(true);

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

  React.useEffect(() => {
    const fetchTraining = async () => {
      if (!trainingId) return;

      if (isPublic) {
        if (!publicPort.loading) {
          if (publicPort.data) {
            const found = publicPort.data.trainings.find(
              (t) => t.id === trainingId,
            );
            setTraining(found || null);
          }
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const resp = await getPortfolioTrainingById(Number(trainingId));
        if (resp.data) {
          const t = cleanNullStr(resp.data);
          const mapped: Training = {
            id: t.id.toString(),
            year: t.year?.toString() || "",
            name: t.name || "",
            organize: t.organize || "",
            country: t.country || "",
            description: t.description || "",
            attachments: t.attachments.map((a: any) => {
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
          setTraining(mapped);
        }
      } catch (error) {
        console.error("Error fetching training detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTraining();
  }, [trainingId, isPublic, publicPort.data, publicPort.loading]);

  const handleBackClick = () => {
    if (isPublic && shareToken) {
      navigate(`/p/${shareToken}#training-section`, { state: location.state });
    } else if (portfolioId) {
      navigate(
        paths.student.portfolio.ePortfolio.view.replace(
          ":portfolioId",
          portfolioId,
        ) + "#training-section",
        { state: location.state },
      );
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  if (!training) {
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
          <p style={{ color: "var(--port-primary)" }}>Training not found</p>
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
        <div className="flex flex-col w-full mx-auto pt-28 pb-48 max-w-7xl px-8">
          {training.attachments && training.attachments.length > 0 && (
            <div className="mb-9 w-full">
              <ImageSlider
                images={training.attachments
                  .filter((att) => att.fileType === "image")
                  .map((att) => ({
                    id: att.id,
                    url: att.url || "",
                    alt: att.fileName,
                  }))}
              />
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
              {training.name}
            </h1>

            <div
              className="inline-block border rounded-full px-4 py-1 mb-4 mt-4"
              style={{ borderColor: "var(--port-primary)" }}
            >
              <span
                className="caption-bold"
                style={{ color: "var(--port-primary)" }}
              >
                {training.date || training.year}
              </span>
            </div>

            <div className="py-1">
              <span
                className="caption-regular"
                style={{ color: "var(--port-text-sub)" }}
              >
                {training.organize} {training.country}
              </span>
            </div>

            {training.description && (
              <div className="mt-2">
                <p
                  className="caption-regular"
                  style={{ color: "var(--port-primary)" }}
                >
                  {training.description}
                </p>
              </div>
            )}

            {/* Non-image attachments */}
            {training.attachments &&
              training.attachments.filter((att) => att.fileType !== "image")
                .length > 0 && (
                <div className="mt-8">
                  <h3
                    className="body-bold-2 mb-4"
                    style={{ color: "var(--port-primary)" }}
                  >
                    ไฟล์แนบ
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {training.attachments
                      .filter((att) => att.fileType !== "image")
                      .map((att) => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-3 pl-4 pr-6 py-3 bg-white border border-gray-300 rounded-2xl hover:shadow-md transition-shadow cursor-pointer text-decoration-none flex-shrink-0"
                        >
                          <div
                            className="flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0"
                            style={{
                              backgroundColor: `color-mix(in srgb, var(--port-primary) 15%, transparent)`,
                            }}
                          >
                            {(att.fileType === "video" ||
                              att.fileName.toLowerCase().endsWith(".mp4")) && (
                              <PlayCircleOutlined
                                style={{
                                  color: "var(--port-primary)",
                                  fontSize: 20,
                                }}
                              />
                            )}
                            {att.fileName.toLowerCase().endsWith(".pdf") && (
                              <FilePdfOutlined
                                style={{
                                  color: "var(--port-primary)",
                                  fontSize: 20,
                                }}
                              />
                            )}
                            {!att.fileName.toLowerCase().endsWith(".pdf") &&
                              !att.fileName.toLowerCase().endsWith(".mp4") &&
                              att.fileType === "file" && (
                                <FileOutlined
                                  style={{
                                    color: "var(--port-primary)",
                                    fontSize: 20,
                                  }}
                                />
                              )}
                            {att.fileType === "link" && (
                              <LinkOutlined
                                style={{
                                  color: "var(--port-primary)",
                                  fontSize: 20,
                                }}
                              />
                            )}
                          </div>
                          <span
                            className="caption-bold font-semibold whitespace-nowrap"
                            style={{ color: "var(--port-primary)" }}
                          >
                            {att.fileName}
                          </span>
                        </a>
                      ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      <Footer contact={personalInfo?.contact} />
    </div>
  );

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
};

export default StudentTrainingDetailPage;
