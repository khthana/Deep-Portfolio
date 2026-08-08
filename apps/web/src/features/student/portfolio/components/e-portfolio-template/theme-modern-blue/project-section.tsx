import { ProjectOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import type { Project, PersonalInfo } from "../types";
import { paths } from "../../../../../../routes/paths.config";
import { useTheme } from "../theme-context.shared";

interface ProjectCardProps {
  project: Project;
  personalInfo?: PersonalInfo;
  isReadOnly?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  personalInfo,
  isReadOnly,
}) => {
  const navigate = useNavigate();
  const { portfolioId, shareToken } = useParams<{
    portfolioId?: string;
    shareToken?: string;
  }>();
  const { theme } = useTheme();

  const handleProjectClick = () => {
    if (isReadOnly && !shareToken) return;
    if (project.id) {
      if (isReadOnly && shareToken) {
        navigate(
          paths.public.projectDetail
            .replace(":shareToken", shareToken)
            .replace(":projectId", project.id),
          { state: { theme, personalInfo } },
        );
      } else {
        navigate(
          paths.student.portfolio.ePortfolio.projectDetail
            .replace(":portfolioId", portfolioId || "")
            .replace(":projectId", project.id),
          { state: { theme, personalInfo } },
        );
      }
    }
  };

  return (
    <div
      onClick={handleProjectClick}
      className="border-2 rounded-2xl p-10 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-300 cursor-pointer"
      style={{
        backgroundColor: "var(--port-card)",
        borderColor: "color-mix(in srgb, var(--port-primary) 63%, transparent)",
      }}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="body-bold-1" style={{ color: "var(--port-primary)" }}>
            {project.title}
          </h3>
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
        <p
          className="text-lg leading-relaxed line-clamp-3"
          style={{ color: "var(--port-primary)" }}
        >
          {project.description}
        </p>
      </div>
    </div>
  );
};

interface ProjectSectionProps {
  projects: Project[];
  personalInfo?: PersonalInfo;
  isReadOnly?: boolean;
}

export const ProjectSection: React.FC<ProjectSectionProps> = ({
  projects,
  personalInfo,
  isReadOnly,
}) => {
  const displayProjects = projects;

  if (!displayProjects || displayProjects.length === 0) return null;

  return (
    <section
      className="py-12"
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--port-primary) 5%, transparent)",
      }}
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center gap-5 mb-8">
          <ProjectOutlined
            className="text-5xl"
            style={{ color: "var(--port-primary)" }}
          />
          <h2 className="body-bold-1" style={{ color: "var(--port-primary)" }}>
            โครงงานปริญญาตรี
          </h2>
          <div
            className="flex-grow h-px"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--port-primary) 30%, transparent)",
            }}
          ></div>
        </div>

        <div className="space-y-6">
          {displayProjects.map((project, index) => (
            <ProjectCard
              key={project.id || index}
              project={project}
              personalInfo={personalInfo}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
