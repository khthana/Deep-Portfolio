import { SafetyCertificateOutlined } from "@ant-design/icons";
import type { Certificate, PersonalInfo } from "../types";
import { useNavigate, useParams } from "react-router-dom";
import { paths } from "../../../../../../routes/paths.config";
import { useTheme } from "../theme-context.shared";

interface CertificateSectionProps {
  certificates: Certificate[];
  personalInfo?: PersonalInfo;
  isReadOnly?: boolean;
}

const CertificateCard: React.FC<{
  certificate: Certificate;
  personalInfo?: PersonalInfo;
  isReadOnly?: boolean;
}> = ({ certificate, personalInfo, isReadOnly }) => {
  const navigate = useNavigate();
  const { portfolioId, shareToken } = useParams<{
    portfolioId?: string;
    shareToken?: string;
  }>();
  const { theme } = useTheme();

  const handleNavigate = () => {
    if (isReadOnly && !shareToken) return;
    if (certificate.id) {
      if (isReadOnly && shareToken) {
        navigate(
          paths.public.certificateDetail
            .replace(":shareToken", shareToken)
            .replace(":certificateId", certificate.id),
          { state: { theme, personalInfo } },
        );
      } else {
        navigate(
          paths.student.portfolio.ePortfolio.certificateDetail
            .replace(":portfolioId", portfolioId || "")
            .replace(":certificateId", certificate.id),
          { state: { theme, personalInfo } },
        );
      }
    }
  };

  return (
    <div
      onClick={handleNavigate}
      className="border-2 rounded-2xl p-10 shadow-lg flex flex-col md:flex-row gap-8 cursor-pointer transition-all hover:-translate-y-1 transition-all duration-300"
      style={{
        backgroundColor: "var(--port-card)",
        borderColor: "color-mix(in srgb, var(--port-primary) 63%, transparent)",
      }}
    >
      <div className="body-bold-1" style={{ color: "var(--port-primary)" }}>
        {certificate.date.split(" ").slice(-1)[0]}
      </div>
      <div className="space-y-1 flex-grow text-center md:text-left">
        <p className="body-bold-2" style={{ color: "var(--port-primary)" }}>
          {certificate.name}
        </p>
        <div className="space-y-1">
          <p
            className="caption-regular"
            style={{ color: "var(--port-primary)" }}
          >
            {certificate.organizer}
          </p>
        </div>
      </div>
    </div>
  );
};

export const CertificateSection: React.FC<CertificateSectionProps> = ({
  certificates,
  personalInfo,
  isReadOnly,
}) => {
  if (!certificates || certificates.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-8 py-12">
      <div className="flex items-center gap-5 mb-8">
        <SafetyCertificateOutlined
          className="text-5xl"
          style={{ color: "var(--port-primary)" }}
        />
        <h2 className="body-bold-1" style={{ color: "var(--port-primary)" }}>
          คุณวุฒิทางวิชาชีพ
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
        {certificates.map((cert, index) => (
          <CertificateCard
            key={cert.id || index}
            certificate={cert}
            personalInfo={personalInfo}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    </section>
  );
};
