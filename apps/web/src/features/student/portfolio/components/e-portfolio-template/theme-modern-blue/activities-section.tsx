import { TeamOutlined } from "@ant-design/icons";
import type { Activity, PersonalInfo } from "../types";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../theme-context.shared";

import { paths } from "../../../../../../routes/paths.config";

interface ActivityCircleProps {
  activity: Activity;
  personalInfo?: PersonalInfo;
  isReadOnly?: boolean;
}

const ActivityCircle: React.FC<ActivityCircleProps> = ({
  activity,
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
    if (activity.id) {
      if (isReadOnly && shareToken) {
        navigate(
          paths.public.activityDetail
            .replace(":shareToken", shareToken)
            .replace(":activityId", activity.id),
          { state: { theme, personalInfo } },
        );
      } else {
        navigate(
          paths.student.portfolio.ePortfolio.activityDetail
            .replace(":portfolioId", portfolioId || "")
            .replace(":activityId", activity.id),
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
      className="w-64 h-64 border-2 rounded-full shadow-lg flex flex-col items-center justify-center gap-2 p-4 cursor-pointer hover:-translate-y-1 transition-all duration-300"
      style={{
        backgroundColor: "var(--port-card)",
        borderColor: "color-mix(in srgb, var(--port-primary) 63%, transparent)",
      }}
    >
      <p className="body-bold-1" style={{ color: "var(--port-primary)" }}>
        {activity.year}
      </p>
      <div className="text-center space-y-1">
        <p className="body-bold-3" style={{ color: "var(--port-primary)" }}>
          {activity.title}
        </p>
        <div
          className="caption-regular"
          style={{ color: "var(--port-text-sub)" }}
        >
          {activity.role}
        </div>
      </div>
    </div>
  );
};

interface ActivitiesSectionProps {
  activities: Activity[];
  personalInfo?: PersonalInfo;
  isReadOnly?: boolean;
}

export const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({
  activities,
  personalInfo,
  isReadOnly,
}) => {
  if (!activities || activities.length === 0) return null;

  return (
    <section className="py-12" style={{ backgroundColor: "var(--port-card)" }}>
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center gap-5 mb-12">
          <TeamOutlined
            className="text-5xl"
            style={{ color: "var(--port-primary)" }}
          />
          <h2 className="body-bold-1" style={{ color: "var(--port-primary)" }}>
            กิจกรรม
          </h2>
          <div
            className="flex-grow h-px"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--port-primary) 30%, transparent)",
            }}
          ></div>
        </div>

        <div className="flex gap-8 flex-wrap">
          {activities.map((activity, index) => (
            <ActivityCircle
              key={activity.id || index}
              activity={activity}
              personalInfo={personalInfo}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
