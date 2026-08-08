import { ReadOutlined } from "@ant-design/icons";
import type { Education } from "../types";

const EducationCard = ({ education }: { education: Education }) => {
  const dateRange = education.endDate
    ? `${education.startDate} - ${education.endDate}`
    : `${education.startDate} - ปัจจุบัน`;

  return (
    <div
      className="border-l-4 pl-6 space-y-2"
      style={{ borderColor: "var(--port-primary)" }}
    >
      <p
        className="body-bold-3 inline-block"
        style={{ color: "var(--port-primary)" }}
      >
        {dateRange}
      </p>
      <div className="space-y-2">
        <p className="body-bold-2" style={{ color: "var(--port-primary)" }}>
          {education.degree}
        </p>
        <div>
          <p
            className="caption-regular"
            style={{ color: "var(--port-primary)" }}
          >
            {education.institution}
          </p>
          {education.field && (
            <p
              className="caption-regular"
              style={{ color: "var(--port-text-sub)" }}
            >
              {education.field}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface EducationSectionProps {
  education: Education[];
  isReadOnly?: boolean;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  education,
  isReadOnly,
}) => {
  if (!education || education.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-8 py-12">
      <div className="flex items-center gap-5 mb-8">
        <ReadOutlined
          className="text-5xl"
          style={{ color: "var(--port-primary)" }}
        />
        <h2 className="body-bold-1" style={{ color: "var(--port-primary)" }}>
          ประวัติการศึกษา
        </h2>
        <div
          className="flex-grow h-px"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--port-primary) 30%, transparent)",
          }}
        ></div>
      </div>

      <div
        className="border-2 rounded-2xl p-12 shadow-lg"
        style={{
          backgroundColor: "var(--port-card)",
          borderColor:
            "color-mix(in srgb, var(--port-primary) 63%, transparent)",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
          {education
            .filter((edu: Education) => edu.isShow !== false)
            .map((edu: Education, index: number) => (
              <EducationCard key={edu.id || index} education={edu} />
            ))}
        </div>
      </div>
    </section>
  );
};
