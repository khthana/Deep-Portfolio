import { SolutionOutlined, GlobalOutlined } from "@ant-design/icons";
import type { Experience, PersonalInfo } from "../types";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../theme-context.shared";

import { paths } from "../../../../../../routes/paths.config";

interface ExperienceCardProps {
  experience: Experience;
  personalInfo?: PersonalInfo;
  isReadOnly?: boolean;
}

const ExperienceCard: React.FC<ExperienceCardProps> = ({
  experience,
  personalInfo,
  isReadOnly,
}) => {
  const navigate = useNavigate();
  const { portfolioId, shareToken } = useParams<{
    portfolioId?: string;
    shareToken?: string;
  }>();
  const { theme } = useTheme();

  const onClick = () => {
    if (isReadOnly && !shareToken) return;
    if (experience.id) {
      if (isReadOnly && shareToken) {
        navigate(
          paths.public.experienceDetail
            .replace(":shareToken", shareToken)
            .replace(":experienceId", experience.id),
          { state: { theme, personalInfo } },
        );
      } else {
        navigate(
          paths.student.portfolio.ePortfolio.experienceDetail
            .replace(":portfolioId", portfolioId || "")
            .replace(":experienceId", experience.id),
          { state: { theme, personalInfo } },
        );
      }
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="border-2 rounded-2xl p-8 shadow-md flex gap-8 items-start hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      style={{
        backgroundColor: "var(--port-card)",
        borderColor: "color-mix(in srgb, var(--port-primary) 63%, transparent)",
      }}
    >
      <div className="space-y-2 flex-grow">
        <h3
          className="body-bold-1"
          style={{
            color: "var(--port-primary)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-all",
          }}
        >
          {experience.position}
        </h3>
        <div className="space-y-1">
          <p
            className="font-medium text-lg"
            style={{
              color: "var(--port-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {experience.company}
          </p>
          <p
            className="flex items-center gap-2"
            style={{
              color: "var(--port-text-sub)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <GlobalOutlined /> {experience.location}
          </p>
        </div>
      </div>
      <div
        className="inline-block border rounded-full px-4 py-1"
        style={{ borderColor: "var(--port-primary)" }}
      >
        <span className="caption-bold" style={{ color: "var(--port-primary)" }}>
          {experience.year}
        </span>
      </div>
    </div>
  );
};

interface ExperienceSectionProps {
  experiences: Experience[];
  personalInfo?: PersonalInfo;
  isReadOnly?: boolean;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  experiences,
  personalInfo,
  isReadOnly,
}) => {
  if (!experiences || experiences.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-8 py-12">
      <div className="flex items-center gap-5 mb-8">
        <SolutionOutlined
          className="text-5xl"
          style={{ color: "var(--port-primary)" }}
        />
        <h2 className="body-bold-1" style={{ color: "var(--port-primary)" }}>
          ประสบการณ์ทำงาน
        </h2>
        <div
          className="flex-grow h-px"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--port-primary) 30%, transparent)",
          }}
        ></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {experiences.map((exp, index) => (
          <ExperienceCard
            key={exp.id || index}
            experience={exp}
            personalInfo={personalInfo}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    </section>
  );
};
