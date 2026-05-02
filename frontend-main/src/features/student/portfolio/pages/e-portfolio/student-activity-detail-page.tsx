import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { ThemeProvider } from "../../components/e-portfolio-template/theme-context";
import type {
  PortfolioTheme,
  PersonalInfo,
  Activity,
} from "../../components/e-portfolio-template/types";
import { Header } from "../../components/e-portfolio-template/theme-modern-blue/header";
import { Footer } from "../../components/e-portfolio-template/theme-modern-blue/footer";
import { ImageSlider } from "../../components/common/image-slider";
import { getPortfolioActivityById } from "../../../../../services/portfolio-activity.service";
import { BACKEND_API_URL } from "../../../../../lib/axios";
import { getFile } from "../../../../../utils/get-file";
import { MOCK_PORTFOLIO_DATA } from "../../data/mock-portfolio-data";

import { paths } from "../../../../../routes/paths.config";
import { usePublicPortfolio } from "../../hooks/use-public-portfolio";

const StudentActivityDetailPage: React.FC = () => {
  const { activityId, portfolioId, shareToken } = useParams<{
    activityId: string;
    portfolioId?: string;
    shareToken?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
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

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  const isPublic = !!shareToken;
  const publicPort = usePublicPortfolio(shareToken || "", !isPublic);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!activityId) {
        setLoading(false);
        return;
      }

      if (isPublic) {
        if (!publicPort.loading) {
          if (publicPort.data) {
            const found = publicPort.data.activities.find(
              (a) => a.id === activityId,
            );
            setActivity(found || null);
          }
          setLoading(false);
        }
        return;
      }

      try {
        const resp = await getPortfolioActivityById(Number(activityId));
        const a = resp.data;
        if (!a) {
          setActivity(null);
          return;
        }

        const isImg = (filename: string | null) => {
          if (!filename) return false;
          const ext = filename.split(".").pop()?.toLowerCase();
          return [
            "jpg",
            "jpeg",
            "png",
            "gif",
            "webp",
            "svg",
            "svg+xml",
          ].includes(ext || "");
        };

        setActivity({
          id: a.id.toString(),
          year: a.date
            ? (new Date(a.date).getFullYear() + 543).toString()
            : "-",
          title: a.name || "",
          role: a.role || "",
          description: a.description || "",
          date: a.date
            ? new Date(a.date).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : undefined,
          attachments: (a.attachments || []).map((att) => ({
            id: att.attachment_id.toString(),
            fileName: att.original_filename || "",
            fileType: isImg(att.original_filename) ? "image" : "file",
            url: att.url
              ? att.url.startsWith("http")
                ? att.url
                : getFile(att.url)
              : undefined,
          })),
        });
      } catch (error) {
        console.error("Failed to fetch activity:", error);
        setActivity(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId, isPublic, publicPort.data, publicPort.loading]);

  const handleBackClick = () => {
    if (isPublic && shareToken) {
      navigate(`/p/${shareToken}#activity-section`, { state: location.state });
    } else if (portfolioId) {
      navigate(
        paths.student.portfolio.ePortfolio.view.replace(
          ":portfolioId",
          portfolioId,
        ) + "#activity-section",
        { state: location.state },
      );
    } else {
      navigate(-1);
    }
  };

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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin indicator={antIcon} size="large" />
      </div>
    );
  }

  if (!activity) {
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
          <p style={{ color: "var(--port-primary)" }}>Activity not found</p>
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
          {activity.attachments && activity.attachments.length > 0 && (
            <div className="mb-9 w-full">
              <ImageSlider
                images={activity.attachments
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
              {activity.title}
            </h1>

            {activity.date && (
              <div
                className="inline-block border rounded-full px-4 py-1 mb-4 mt-4"
                style={{ borderColor: "var(--port-primary)" }}
              >
                <span
                  className="caption-bold"
                  style={{ color: "var(--port-primary)" }}
                >
                  {activity.date}
                </span>
              </div>
            )}

            <div className="py-1">
              <span
                className="body-bold-1"
                style={{ color: "var(--port-primary)" }}
              >
                {activity.role}
              </span>
            </div>

            {activity.description && (
                <p
                  className="body-1 whitespace-pre-wrap"
                  style={{ color: "var(--port-primary)" }}
                >
                  {activity.description}
                </p>
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

export default StudentActivityDetailPage;
