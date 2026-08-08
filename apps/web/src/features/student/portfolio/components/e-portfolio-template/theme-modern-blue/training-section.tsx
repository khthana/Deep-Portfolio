import { SolutionOutlined } from "@ant-design/icons";
import type { PersonalInfo, Training } from "../types";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../theme-context.shared";

import { paths } from "../../../../../../routes/paths.config";

interface TrainingSectionProps {
  trainings: Training[];
  personalInfo?: PersonalInfo;
  isReadOnly?: boolean;
}

const TrainingCard: React.FC<{
  training: Training;
  personalInfo?: PersonalInfo;
  isReadOnly?: boolean;
}> = ({ training, personalInfo, isReadOnly }) => {
  const navigate = useNavigate();
  const { portfolioId, shareToken } = useParams<{
    portfolioId?: string;
    shareToken?: string;
  }>();
  const { theme } = useTheme();

  const onClick = () => {
    if (isReadOnly && !shareToken) return;
    if (training.id) {
      if (isReadOnly && shareToken) {
        navigate(
          paths.public.trainingDetail
            .replace(":shareToken", shareToken)
            .replace(":trainingId", training.id),
          { state: { theme, personalInfo } },
        );
      } else {
        navigate(
          paths.student.portfolio.ePortfolio.trainingDetail
            .replace(":portfolioId", portfolioId || "")
            .replace(":trainingId", training.id),
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
      className="border-2 rounded-2xl p-8 shadow-sm flex gap-8 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      style={{
        backgroundColor: "var(--port-card)",
        borderColor: "color-mix(in srgb, var(--port-primary) 63%, transparent)",
      }}
    >
      <div className="body-bold-1" style={{ color: "var(--port-primary)" }}>
        {training.year}
      </div>
      <div className="space-y-1">
        <p className="body-bold-2" style={{ color: "var(--port-primary)" }}>
          {training.name}
        </p>
        <div className="flex flex-col">
          <p
            className="caption-regular"
            style={{ color: "var(--port-primary)" }}
          >
            {training.organize}
          </p>
          {training.country && (
            <p
              className="caption-regular"
              style={{ color: "var(--port-text-sub)" }}
            >
              {training.country}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const TrainingSection: React.FC<TrainingSectionProps> = ({
  trainings,
  personalInfo,
  isReadOnly,
}) => {
  if (!trainings || trainings.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-8 py-12">
      <div className="flex items-center gap-5 mb-8">
        <SolutionOutlined
          className="text-5xl"
          style={{ color: "var(--port-primary)" }}
        />
        <h2 className="body-bold-1" style={{ color: "var(--port-primary)" }}>
          การฝึกอบรม
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
        {trainings.map((training, index) => (
          <TrainingCard
            key={training.id || index}
            training={training}
            personalInfo={personalInfo}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    </section>
  );
};
