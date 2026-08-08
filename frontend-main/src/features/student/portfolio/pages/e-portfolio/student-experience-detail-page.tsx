import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeftOutlined,
  FilePdfOutlined,
  PlayCircleOutlined,
  LinkOutlined,
  FileOutlined,
} from "@ant-design/icons";
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

import { usePortfolio } from "../../hooks/use-portfolio";
import { usePublicPortfolio } from "../../hooks/use-public-portfolio";

const StudentExperienceDetailPage: React.FC = () => {
  const { experienceId, portfolioId, shareToken } = useParams<{
    experienceId: string;
    portfolioId?: string;
    shareToken?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  const isPublic = !!shareToken;
  const activeId = shareToken || portfolioId || "portfolio-1";

  const internalPort = usePortfolio(isPublic ? "" : activeId, isPublic);
  const publicPort = usePublicPortfolio(isPublic ? activeId : "", !isPublic);

  const data = isPublic ? publicPort.data : internalPort.data;

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

  const experience = data?.experiences.find((exp) => exp.id === experienceId);

  const handleBackClick = () => {
    if (isPublic && shareToken) {
      navigate(`/p/${shareToken}#experience-section`, {
        state: location.state,
      });
    } else if (portfolioId) {
      navigate(
        paths.student.portfolio.ePortfolio.view.replace(
          ":portfolioId",
          portfolioId,
        ) + "#experience-section",
        { state: location.state },
      );
    } else {
      navigate(-1);
    }
  };

  if (!experience) {
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
          <p style={{ color: "var(--port-primary)" }}>Experience not found</p>
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
          {experience.attachments && experience.attachments.length > 0 && (
            <div className="mb-9 w-full">
              <ImageSlider
                images={experience.attachments
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
          <div className="mb-2">
            <h1 className="header-2" style={{ color: "var(--port-primary)" }}>
              {experience.position}
            </h1>
            <div
              className="inline-block border rounded-full px-4 py-1 mb-4"
              style={{ borderColor: "var(--port-primary)" }}
            >
              <span
                className="caption-bold"
                style={{ color: "var(--port-primary)" }}
              >
                {experience.startDate} - {experience.endDate}
              </span>
            </div>
            <div className="py-1">
              <span
                className="caption-regular"
                style={{ color: "var(--port-text-sub)" }}
              >
                {experience.company} {experience.location} {experience.country}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-10 py-9">
            <div className="grid grid-cols-2 gap-18">
              {experience.isShowResp && experience.resp && (
                <div>
                  <h2
                    className="body-bold-1 mb-3"
                    style={{ color: "var(--port-primary)" }}
                  >
                    หน้าที่ความรับผิดชอบ
                  </h2>
                  <p
                    className="caption-regular leading-relaxed"
                    style={{ color: "var(--port-primary)" }}
                  >
                    {experience.resp}
                  </p>
                </div>
              )}

              {experience.isShowLearning && experience.learningOutcome && (
                <div>
                  <h2
                    className="body-bold-1 mb-3"
                    style={{ color: "var(--port-primary)" }}
                  >
                    สิ่งที่เรียนรู้จากการทำงาน
                  </h2>
                  <p
                    className="caption-regular leading-relaxed"
                    style={{ color: "var(--port-primary)" }}
                  >
                    {experience.learningOutcome}
                  </p>
                </div>
              )}
            </div>

            {experience.isShowReflection && experience.reflection && (
              <div>
                <h2
                  className="body-bold-1 mb-3"
                  style={{ color: "var(--port-primary)" }}
                >
                  สิ่งที่สะท้อนความคิดจากการทำงาน
                </h2>
                <p
                  className="caption-regular leading-relaxed"
                  style={{ color: "var(--port-primary)" }}
                >
                  {experience.reflection}
                </p>
              </div>
            )}
            {/* Non-image attachments */}
            {experience.attachments &&
              experience.attachments.filter((att) => att.fileType !== "image")
                .length > 0 && (
                <div className="mt-8">
                  <h3
                    className="body-bold-2 mb-4"
                    style={{ color: "var(--port-primary)" }}
                  >
                    ไฟล์แนบ
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {experience.attachments
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

export default StudentExperienceDetailPage;
