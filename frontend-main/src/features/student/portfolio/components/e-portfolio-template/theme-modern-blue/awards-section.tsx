import { TrophyOutlined } from "@ant-design/icons";
import type { Award, PersonalInfo } from "../types";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../theme-context.shared";

import { paths } from "../../../../../../routes/paths.config";

interface AwardCardProps {
  award: Award;
  personalInfo?: PersonalInfo;
  isReadOnly?: boolean;
}

const AwardCard: React.FC<AwardCardProps> = ({
  award,
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
    if (award.id) {
      if (isReadOnly && shareToken) {
        navigate(
          paths.public.awardDetail
            .replace(":shareToken", shareToken)
            .replace(":awardId", award.id),
          { state: { theme, personalInfo } },
        );
      } else {
        navigate(
          paths.student.portfolio.ePortfolio.awardDetail
            .replace(":portfolioId", portfolioId || "")
            .replace(":awardId", award.id),
          { state: { theme, personalInfo } },
        );
      }
    }
  };

  const coverImage = award.attachments?.find(
    (att) => att.fileType === "image",
  )?.url;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="border-2 rounded-2xl overflow-hidden shadow-lg group hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--port-primary) 10%, transparent)",
        borderColor: "color-mix(in srgb, var(--port-primary) 63%, transparent)",
      }}
    >
      <div
        className={`h-48 flex items-center justify-center overflow-hidden ${
          coverImage ? "bg-gray-100" : ""
        }`}
        style={
          !coverImage
            ? {
                background: `linear-gradient(to bottom right, var(--port-primary), color-mix(in srgb, var(--port-primary) 80%, transparent))`,
              }
            : {}
        }
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={award.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <TrophyOutlined
            className="text-6xl"
            style={{ color: "var(--port-primary)" }}
          />
        )}
      </div>

      <div
        className="p-8 space-y-3 text-center border-t-2"
        style={{
          borderColor:
            "color-mix(in srgb, var(--port-primary) 63%, transparent)",
        }}
      >
        <p className="body-bold-3" style={{ color: "var(--port-primary)" }}>
          {award.date}
        </p>
        <p
          className="body-bold-2 line-clamp-2"
          title={award.name}
          style={{ color: "var(--port-primary)" }}
        >
          {award.name}
        </p>
        <p
          className="caption-regular truncate"
          style={{ color: "var(--port-text-sub)" }}
        >
          {award.organizer}
        </p>
      </div>
    </div>
  );
};

interface AwardsSectionProps {
  awards: Award[];
  personalInfo?: PersonalInfo;
  isReadOnly?: boolean;
}

export const AwardsSection: React.FC<AwardsSectionProps> = ({
  awards,
  personalInfo,
  isReadOnly,
}) => {
  if (!awards || awards.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-8 py-12">
      <div className="flex items-center gap-5 mb-8">
        <TrophyOutlined
          className="text-5xl"
          style={{ color: "var(--port-primary)" }}
        />
        <h2 className="body-bold-1" style={{ color: "var(--port-primary)" }}>
          รางวัลและการแข่งขัน
        </h2>
        <div
          className="flex-grow h-px"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--port-primary) 30%, transparent)",
          }}
        ></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {awards.map((award, index) => (
          <AwardCard
            key={award.id || index}
            award={award}
            personalInfo={personalInfo}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    </section>
  );
};
