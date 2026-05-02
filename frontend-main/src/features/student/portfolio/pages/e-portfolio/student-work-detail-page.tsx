import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getFile } from "../../../../../utils/get-file";
import { Image as AntImage, Spin } from "antd";
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  PictureOutlined,
  FilePdfOutlined,
  LinkOutlined,
  FileOutlined,
  GithubOutlined,
} from "@ant-design/icons";
import { ThemeProvider } from "../../components/e-portfolio-template/theme-context";
import type {
  PortfolioTheme,
  PersonalInfo,
  Work as BaseWork,
} from "../../components/e-portfolio-template/types";

interface ExtendedWork extends BaseWork {
  relatedSkills?: { id: string; name: string }[];
}

interface Mapping {
  id: number;
  student_activity_id: number;
  repository?: string;
  isShowRepo?: boolean;
  role_and_resp?: string;
  isShowRole?: boolean;
  init_expect?: string;
  isShowInit?: boolean;
  reflection?: string;
  isShowReflec?: boolean;
}
import { Header } from "../../components/e-portfolio-template/theme-modern-blue/header";
import { Footer } from "../../components/e-portfolio-template/theme-modern-blue/footer";
import { useEffect, useState } from "react";
import {
  getActivityDetails,
  getStudentActivityAttachments,
} from "../../../../../services/student.service";
import { getAllPortfolioSkill } from "../../../../../services/portfolio-skill.service";
import { MOCK_PORTFOLIO_DATA } from "../../data/mock-portfolio-data";
import { paths } from "../../../../../routes/paths.config";
import { usePublicPortfolio } from "../../hooks/use-public-portfolio";
import { cleanNullStr } from "../../../../../utils/clean-null-str";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

const StudentWorkDetailPage: React.FC = () => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const { workId, portfolioId, shareToken } = useParams<{
    workId: string;
    portfolioId?: string;
    shareToken?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [work, setWork] = useState<ExtendedWork | null>(null);
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
    const fetchWork = async () => {
      if (!workId) {
        setLoading(false);
        return;
      }

      if (isPublic) {
        if (!publicPort.loading) {
          if (publicPort.data) {
            const foundWork = publicPort.data.works?.find(
              (w) => w.id === workId,
            );
            if (foundWork) {
              setWork(foundWork as ExtendedWork);
            } else {
              setWork(null);
            }
          }
          setLoading(false);
        }
        return;
      }

      try {
        const studentActivityId = Number(workId);

        const [activityRes, attachRes, skillsRes] = await Promise.all([
          getActivityDetails(studentActivityId),
          getStudentActivityAttachments(studentActivityId),
          getAllPortfolioSkill(studentId),
        ]);

        if (activityRes.success && skillsRes.success) {
          const act = cleanNullStr(activityRes.data);
          const cleanedSkills = cleanNullStr(skillsRes.data);

          // Find all skills that have this activity mapped
          const relatedSkillIds: string[] = [];

          // Also need to find at least one mapping to get reflection, role, etc.
          // since these are stored on the mapping level. We'll use the first one.
          let primaryMapping: Record<string, unknown> | null = null;

          for (const skill of cleanedSkills) {
            if (skill.mappings && skill.mappings.length > 0) {
              const mapping = skill.mappings.find(
                (m: { student_activity_id: number }) =>
                  m.student_activity_id === studentActivityId,
              );
              if (mapping) {
                relatedSkillIds.push(String(skill.id));
                if (!primaryMapping) {
                  primaryMapping = mapping;
                }
              }
            }
          }

          if (primaryMapping) {
            const mapped: ExtendedWork = {
              id: String(studentActivityId),
              title: act.activities?.activity_name || "ไม่มีชื่อกิจกรรม",
              subtitle:
                act.course?.course_name_en ||
                act.course?.course_name_th ||
                "ไม่มีชื่อวิชา",
              repositoryUrl: (primaryMapping.repository as string) || undefined,
              isShowRepo: Boolean(primaryMapping.isShowRepo),
              roleAndResp:
                (primaryMapping.role_and_resp as string) || undefined,
              isShowRole: Boolean(primaryMapping.isShowRole),
              initialExpectation:
                (primaryMapping.init_expect as string) || undefined,
              isShowExpectation: Boolean(primaryMapping.isShowInit),
              reflection: (primaryMapping.reflection as string) || undefined,
              isShowReflection: Boolean(primaryMapping.isShowReflec),
              feedback: act.feedback || undefined,
              attachments: (attachRes.success ? attachRes.data : []).map(
                (a: {
                  original_filename: string;
                  url?: string;
                  file_type?: string;
                  attachment_id: number;
                }) => {
                  const ext = a.original_filename
                    .split(".")
                    .pop()
                    ?.toLowerCase();
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
                    fileType: isImg
                      ? "image"
                      : ext === "mp4" || ext === "mov"
                        ? "video"
                        : ext === "pdf"
                          ? "pdf"
                          : "file",
                    fileName: a.original_filename,
                    url: a.url
                      ? a.url.startsWith("http")
                        ? a.url
                        : getFile(a.url)
                      : undefined,
                  };
                },
              ),
              relatedSkillIds: relatedSkillIds,
              relatedSkills: relatedSkillIds.map((id) => {
                const s = skillsRes.data.find(
                  (s: { id: number; name?: string | null }) =>
                    String(s.id) === id,
                );
                return { id, name: s?.name || "ทักษะ" };
              }),
            };
            setWork(mapped);
          }
        }
      } catch (error) {
        console.error("Failed to fetch work details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWork();
  }, [workId, studentId, isPublic, publicPort.data, publicPort.loading]);

  const handleBackClick = () => {
    if (isPublic && shareToken) {
      navigate(`/p/${shareToken}#skills-section`, { state: location.state });
    } else if (portfolioId) {
      navigate(
        paths.student.portfolio.ePortfolio.view.replace(
          ":portfolioId",
          portfolioId,
        ) + "#work-section",
        { state: location.state },
      );
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-port-bg">
        <Spin size="large" />
      </div>
    );
  }

  if (!work) {
    return (
      <div
        className="min-h-screen font-sans bg-port-bg flex flex-col items-center justify-center"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
        }}
      >
        <p style={{ color: "var(--port-primary)" }} className="header-3">
          ไม่พบข้อมูลผลงาน
        </p>
        <button
          onClick={handleBackClick}
          className="mt-4 px-6 py-2 rounded-full border border-port-primary text-port-primary hover:bg-port-primary/10 transition-colors"
        >
          กลับหน้าหลัก
        </button>
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
              {work.title}
            </h1>

            <div className="flex items-start gap-3 mb-4 mt-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {work.isShowRepo && work.repositoryUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={
                          work.repositoryUrl.startsWith("http")
                            ? work.repositoryUrl
                            : `https://${work.repositoryUrl}`
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
                  {work.relatedSkills?.map((skill) => (
                    <div
                      key={skill.id}
                      className="inline-block border rounded-full px-4 py-1"
                      style={{ borderColor: "var(--port-primary)" }}
                    >
                      <span
                        className="caption-bold"
                        style={{ color: "var(--port-primary)" }}
                      >
                        {skill.name}
                      </span>
                    </div>
                  ))}
                </div>
                {work.subtitle && (
                  <div
                    className="caption-regular"
                    style={{
                      color: "var(--port-text-sub)",
                    }}
                  >
                    {work.subtitle}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-row items-start justify-start gap-12 w-full">
            {((work.isShowRole && work.roleAndResp) ||
            (work.isShowExpectation && work.initialExpectation) ||
            (work.isShowReflection && work.reflection)) && (
              <div className="flex-1 flex flex-col items-start gap-12 max-w-[50%]">
                {work.isShowRole && work.roleAndResp && (
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
                      {work.roleAndResp}
                    </p>
                  </div>
                )}

                {work.isShowExpectation && work.initialExpectation && (
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
                      {work.initialExpectation}
                    </p>
                  </div>
                )}

                {work.isShowReflection && work.reflection && (
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
                      {work.reflection}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 flex flex-col items-start gap-2 max-w-[50%]">
              {work.feedback && (
                <div className="mb-12">
                  <h3 className="body-bold-1 text-port-primary mb-4">
                    ความคิดเห็นจากอาจารย์ผู้สอน
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
                      {work.feedback}
                    </p>

                    <span className="absolute -bottom-6 right-6 header-2 text-port-primary/42 leading-none select-none">
                      ”
                    </span>
                  </div>
                </div>
              )}

              {/* Photos Section */}
              {work.attachments &&
                work.attachments.filter((a) => a.fileType === "image").length >
                  0 && (
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
                        {work.attachments
                          .filter((a) => a.fileType === "image")
                          .map((image, idx) => (
                            <AntImage
                              key={idx}
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
              {work.attachments &&
                work.attachments.filter((a) => a.fileType !== "image").length >
                  0 && (
                  <div>
                    <h3
                      className="body-bold-1 mb-4"
                      style={{ color: "var(--port-primary)" }}
                    >
                      ไฟล์แนบ
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {work.attachments
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

export default StudentWorkDetailPage;
