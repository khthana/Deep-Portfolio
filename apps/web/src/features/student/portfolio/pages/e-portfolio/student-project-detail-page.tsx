import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getFile } from "../../../../../utils/get-file";
import { Image as AntImage, Spin } from "antd";
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  FilePdfOutlined,
  LinkOutlined,
  GithubOutlined,
  FileOutlined,
} from "@ant-design/icons";
import WhiteContainer from "../../../../../components/container/white-container";
import { ThemeProvider } from "../../components/e-portfolio-template/theme-context";
import type {
  PortfolioTheme,
  PersonalInfo,
  Project,
} from "../../components/e-portfolio-template/types";
import { Header } from "../../components/e-portfolio-template/theme-modern-blue/header";
import { Footer } from "../../components/e-portfolio-template/theme-modern-blue/footer";
import { useEffect, useState } from "react";
import { getPortfolioThesisById } from "../../../../../services/portfolio-thesis.service";
import { MOCK_PORTFOLIO_DATA } from "../../data/mock-portfolio-data";
import { paths } from "../../../../../routes/paths.config";
import { usePublicPortfolio } from "../../hooks/use-public-portfolio";
import { cleanNullStr } from "../../../../../utils/clean-null-str";

const StudentProjectDetailPage: React.FC = () => {
  const { projectId, portfolioId, shareToken } = useParams<{
    projectId: string;
    portfolioId?: string;
    shareToken?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [project, setProject] = useState<Project | null>(null);
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
    const fetchProject = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }

      if (isPublic) {
        if (!publicPort.loading) {
          if (publicPort.data) {
            const found = publicPort.data.projects.find(
              (p) => p.id === projectId,
            );
            setProject(found || null);
          }
          setLoading(false);
        }
        return;
      }

      try {
        const id = Number(projectId);
        if (isNaN(id)) {
          // If ID is not a number, maybe it's a mock ID?
          // We assume it's a thesis ID for now as per refactor.
          setLoading(false);
          return;
        }
        const res = await getPortfolioThesisById(id);
        if (res.success) {
          const t = cleanNullStr(res.data);
          const mapped: Project = {
            id: String(t.id),
            title: t.name,
            tag: "โครงงานปริญญาตรี",
            description: t.role_and_resp || "",
            repositoryUrl: t.repository || undefined,
            roleAndResp: t.role_and_resp || undefined,
            isShowRole: t.is_show_role,
            initialExpectation: t.init_expect || undefined,
            isShowInitialExpectation: t.is_show_init,
            reflection: t.reflection || undefined,
            isShowReflection: t.is_show_reflec,
            attachments: t.attachments.map((a: any) => {
              const ext = a.original_filename.split(".").pop()?.toLowerCase();
              const isImg = [
                "jpg",
                "jpeg",
                "png",
                "gif",
                "webp",
                "svg",
              ].includes(ext || "");
              return {
                id: String(a.attachment_id),
                fileType: isImg ? "image" : ext || "file",
                fileName: a.original_filename,
                url: a.url
                  ? a.url.startsWith("http")
                    ? a.url
                    : getFile(a.url)
                  : undefined,
              };
            }),
          };
          setProject(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch project details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId, isPublic, publicPort.data, publicPort.loading]);

  const handleBackClick = () => {
    if (isPublic && shareToken) {
      navigate(`/p/${shareToken}#project-section`, { state: location.state });
    } else if (portfolioId) {
      navigate(
        paths.student.portfolio.ePortfolio.view.replace(
          ":portfolioId",
          portfolioId,
        ) + "#project-section",
        { state: location.state },
      );
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
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
        <WhiteContainer>
          <div className="max-w-4xl mx-auto px-8 py-12">
            <p style={{ color: "var(--port-primary)" }}>Project not found</p>
          </div>
        </WhiteContainer>
      </div>
    );
  }

  // Removed hasLeftContent as we use flex logic

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
              {project.title}
            </h1>

            <div className="flex items-start gap-3 mb-4 mt-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {project.repositoryUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={
                          project.repositoryUrl.startsWith("http")
                            ? project.repositoryUrl
                            : `https://${project.repositoryUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="caption-bold hover:underline"
                        style={{ color: "var(--port-primary)" }}
                      >
                        <GithubOutlined
                          className="text-3xl"
                          style={{ color: "var(--port-primary)" }}
                        />
                      </a>
                    </div>
                  )}
                  <div
                    className="inline-block border rounded-full px-4 py-1"
                    style={{ borderColor: "var(--port-primary)" }}
                  >
                    <span
                      className="caption-bold"
                      style={{ color: "var(--port-primary)" }}
                    >
                      {project.tag}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-row items-start justify-start gap-12 w-full">
            {((project.isShowRole && project.roleAndResp) ||
              (project.isShowInitialExpectation &&
                project.initialExpectation) ||
              (project.isShowReflection && project.reflection)) && (
              <div className="flex-1 flex flex-col items-start gap-12 max-w-[50%]">
                {project.isShowRole && project.roleAndResp && (
                  <div>
                    <h2
                      className="body-bold-1 mb-2"
                      style={{ color: "var(--port-primary)" }}
                    >
                      บทบาทและการทำงานในชิ้นงาน
                    </h2>
                    <p
                      className="text-base leading-relaxed whitespace-pre-line"
                      style={{ color: "var(--port-primary)" }}
                    >
                      {project.roleAndResp}
                    </p>
                  </div>
                )}

                {project.isShowInitialExpectation &&
                  project.initialExpectation && (
                    <div>
                      <h2
                        className="body-bold-1 mb-2"
                        style={{ color: "var(--port-primary)" }}
                      >
                        ความคาดหวังเริ่มแรกเมื่อจะทำชิ้นงาน
                      </h2>
                      <p
                        className="text-base leading-relaxed whitespace-pre-line"
                        style={{ color: "var(--port-primary)" }}
                      >
                        {project.initialExpectation}
                      </p>
                    </div>
                  )}

                {project.isShowReflection && project.reflection && (
                  <div>
                    <h2
                      className="body-bold-1 mb-2"
                      style={{ color: "var(--port-primary)" }}
                    >
                      สิ่งที่สะท้อนความคิดจากการทำงาน
                    </h2>
                    <p
                      className="text-base leading-relaxed whitespace-pre-line"
                      style={{ color: "var(--port-primary)" }}
                    >
                      {project.reflection}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 flex flex-col items-start gap-2 max-w-[50%]">
              {project.feedback && (
                <div className="mb-12">
                  <h3 className="body-bold-1 text-port-primary mb-4">
                    ความคิดเห็นจากอาจารย์ที่ปรึกษา
                  </h3>

                  <div
                    className="relative p-14 rounded-2xl"
                    style={{
                      backgroundColor: `color-mix(in srgb, var(--port-primary) 15%, transparent)`,
                    }}
                  >
                    <span className="absolute top-4 left-6 header-2 text-port-primary/42 leading-none select-none">
                      “
                    </span>

                    <p
                      className="caption-regular italic text-center leading-relaxed relative z-10"
                      style={{ color: "var(--port-primary)" }}
                    >
                      {project.feedback}
                    </p>

                    <span className="absolute -bottom-6 right-6 header-2 text-port-primary/42 leading-none select-none">
                      ”
                    </span>
                  </div>
                </div>
              )}

              {/* Photos Section */}
              {project.attachments &&
                project.attachments.filter((a) => a.fileType === "image")
                  .length > 0 && (
                  <div className="mb-8">
                    <h3
                      className="body-bold-1 mb-4"
                      style={{ color: "var(--port-primary)" }}
                    >
                      รูปภาพประกอบ
                    </h3>

                    <AntImage.PreviewGroup
                      preview={{
                        zIndex: 10000,
                      }}
                    >
                      <div className="flex gap-2 overflow-x-auto max-w-full py-1">
                        {project.attachments
                          .filter((a) => a.fileType === "image")
                          .map((image) => (
                            <AntImage
                              key={image.id}
                              src={image.url}
                              alt={image.fileName}
                              width={120}
                              height={120}
                              className="object-cover rounded-lg shadow-sm border border-gray-100 flex-shrink-0"
                              preview={{
                                mask: (
                                  <div className="text-white text-sm">
                                    ดูรูป
                                  </div>
                                ),
                                zIndex: 10000,
                              }}
                            />
                          ))}
                      </div>
                    </AntImage.PreviewGroup>
                  </div>
                )}
              {/* Files Section */}
              {project.attachments &&
                project.attachments.filter((a) => a.fileType !== "image")
                  .length > 0 && (
                  <div>
                    <h3
                      className="body-bold-1 mb-4"
                      style={{ color: "var(--port-primary)" }}
                    >
                      ไฟล์แนบ
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {project.attachments
                        .filter((a) => a.fileType !== "image")
                        .map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 pl-4 pr-6 py-3 bg-white border border-gray-300 rounded-2xl hover:shadow-md transition-shadow cursor-pointer text-decoration-none"
                          >
                            <div
                              className="flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0"
                              style={{
                                backgroundColor: `color-mix(in srgb, var(--port-primary) 15%, transparent)`,
                              }}
                            >
                              {(attachment.fileType === "video" ||
                                attachment.fileName
                                  .toLowerCase()
                                  .endsWith(".mp4")) && (
                                <PlayCircleOutlined
                                  style={{
                                    color: "var(--port-primary)",
                                    fontSize: 20,
                                  }}
                                />
                              )}
                              {(attachment.fileType === "pdf" ||
                                attachment.fileName
                                  .toLowerCase()
                                  .endsWith(".pdf")) && (
                                <FilePdfOutlined
                                  style={{
                                    color: "var(--port-primary)",
                                    fontSize: 20,
                                  }}
                                />
                              )}
                              {attachment.fileType === "link" && (
                                <LinkOutlined
                                  style={{
                                    color: "var(--port-primary)",
                                    fontSize: 20,
                                  }}
                                />
                              )}
                              {/* Fallback icon for generic files */}
                              {!["video", "pdf", "link"].includes(
                                attachment.fileType,
                              ) &&
                                !attachment.fileName
                                  .toLowerCase()
                                  .endsWith(".mp4") &&
                                !attachment.fileName
                                  .toLowerCase()
                                  .endsWith(".pdf") && (
                                  <FileOutlined
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
                              {attachment.fileName}
                            </span>
                          </a>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
      <Footer contact={personalInfo.contact} />
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

export default StudentProjectDetailPage;
