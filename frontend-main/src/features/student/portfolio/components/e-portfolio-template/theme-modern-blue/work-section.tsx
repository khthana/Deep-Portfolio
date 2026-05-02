import { CodeOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import type { Work, PersonalInfo, ContactInfo, Skill } from "../types";
import { paths } from "../../../../../../routes/paths.config";
import { useTheme } from "../theme-context.shared";

interface WorkCardProps {
  work: Work;
  personalInfo?: PersonalInfo;
  contact?: ContactInfo;
  skills?: Skill[];
  isReadOnly?: boolean;
}

const WorkCard: React.FC<WorkCardProps> = ({
  work,
  personalInfo,
  contact,
  skills,
  isReadOnly,
}) => {
  const navigate = useNavigate();
  const { portfolioId, shareToken } = useParams<{
    portfolioId?: string;
    shareToken?: string;
  }>();
  const { theme } = useTheme();

  const handleWorkClick = () => {
    if (isReadOnly && !shareToken) return;
    if (work.id) {
      if (isReadOnly && shareToken) {
        navigate(
          paths.public.workDetail
            .replace(":shareToken", shareToken)
            .replace(":workId", work.id),
          { state: { theme, personalInfo, contact } },
        );
      } else {
        navigate(
          paths.student.portfolio.ePortfolio.workDetail
            .replace(":portfolioId", portfolioId || "")
            .replace(":workId", work.id),
          { state: { theme, personalInfo, contact } },
        );
      }
    }
  };

  return (
    <div
      onClick={handleWorkClick}
      className="border-2 rounded-2xl p-9 shadow-md hover:shadow-lg transition-all space-y-3 hover:-translate-y-1 duration-300 cursor-pointer"
      style={{
        backgroundColor: "var(--port-card)",
        borderColor: "color-mix(in srgb, var(--port-primary) 63%, transparent)",
      }}
    >
      <div className="space-y-5">
        <div>
          <h3
            className="body-bold-1"
            style={{
              color: "var(--port-primary)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              wordBreak: "break-word",
            }}
          >
            {work.title}
          </h3>
          <p
            className="caption-regular"
            style={{
              color: "var(--port-text-sub)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
              maxWidth: "100%",
            }}
          >
            {work.subtitle}
          </p>
        </div>
        {work.relatedSkillIds && work.relatedSkillIds.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {work.relatedSkillIds.map((skillId) => {
              const skill = skills?.find((s) => s.id === skillId);
              if (!skill) return null;
              return (
                <div
                  key={skillId}
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
              );
            })}
          </div>
        )}
      </div>
      {work.isShowRole && work.roleAndResp && (
        <p
          className="caption-regular leading-relaxed"
          style={{
            color: "var(--port-primary)",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {work.roleAndResp}
        </p>
      )}
      {!work.isShowRole && work.isShowReflection && work.reflection && (
        <p
          className="caption-regular leading-relaxed italic"
          style={{
            color: "var(--port-primary)",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          "{work.reflection}"
        </p>
      )}
    </div>
  );
};

interface WorksSectionProps {
  works: Work[];
  personalInfo?: PersonalInfo;
  contact?: ContactInfo;
  skills?: Skill[];
  isReadOnly?: boolean;
}

export const WorksSection: React.FC<
  WorksSectionProps & { selectedSkillIds?: string[] }
> = ({
  works,
  personalInfo,
  contact,
  selectedSkillIds,
  skills,
  isReadOnly,
}) => {
  const filteredWorks = works.filter((work) => {
    if (!selectedSkillIds || selectedSkillIds.length === 0) return true;

    const workHasSelectedSkills = work.relatedSkillIds?.some((skillId) =>
      selectedSkillIds.includes(skillId),
    );

    return workHasSelectedSkills;
  });

  const uniqueWorksMap = new Map<string, Work>();
  filteredWorks.forEach((work) => {
    const key = work.id || work.title;

    if (uniqueWorksMap.has(key)) {
      const existingWork = uniqueWorksMap.get(key)!;
      const mergedSkillSet = new Set([
        ...(existingWork.relatedSkillIds || []),
        ...(work.relatedSkillIds || []),
      ]);
      existingWork.relatedSkillIds = Array.from(mergedSkillSet);
    } else {
      uniqueWorksMap.set(key, {
        ...work,
        relatedSkillIds: [...(work.relatedSkillIds || [])],
      });
    }
  });

  const uniqueWorks = Array.from(uniqueWorksMap.values());

  if (!uniqueWorks || uniqueWorks.length === 0) return null;

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
          <CodeOutlined
            className="text-5xl"
            style={{ color: "var(--port-primary)" }}
          />
          <h2 className="body-bold-1" style={{ color: "var(--port-primary)" }}>
            ผลงานที่เคยทำ
          </h2>
          <div
            className="flex-grow h-px"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--port-primary) 30%, transparent)",
            }}
          ></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {uniqueWorks.map((work, index) => (
            <WorkCard
              key={work.id || index}
              work={work}
              personalInfo={personalInfo}
              contact={contact}
              skills={skills}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
