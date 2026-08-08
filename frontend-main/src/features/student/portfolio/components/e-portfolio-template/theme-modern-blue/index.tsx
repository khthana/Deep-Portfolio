import React from "react";
import type { EPortfolioTemplateProps } from "../types";
import { ThemeProvider } from "../theme-context";
import { Header } from "./header";
import { HeroSection } from "./hero-section";
import { EducationSection } from "./education-section";
import { WorksSection } from "./work-section";
import { ExperienceSection } from "./experience-section";
import { AwardsSection } from "./awards-section";
import { CertificateSection } from "./certificate-section";
import { TrainingSection } from "./training-section";
import { ProjectSection } from "./project-section";
import { ActivitiesSection } from "./activities-section";
import { Footer } from "./footer";

export const ModernBlueTemplate: React.FC<EPortfolioTemplateProps> = ({
  data,
  theme,
  isReadOnly,
}) => {
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, []);

  return (
    <ThemeProvider theme={theme} wrapperClassName="theme-modern-blue">
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
        }}
      >
        <Header personalInfo={data.personalInfo} />

        <div className="pt-28">
          {data.isShowPersonal && (
            <div id="hero-section">
              <HeroSection
                personalInfo={data.personalInfo}
                about_me={data.about_me}
              />
            </div>
          )}
          {data.isShowEducation && data.education.length > 0 && (
            <div id="education-section">
              <EducationSection
                education={data.education}
                isReadOnly={isReadOnly}
              />
            </div>
          )}
          {data.isShowSkill && data.works.length > 0 && (
            <div id="work-section">
              <WorksSection
                works={data.works}
                personalInfo={data.personalInfo}
                contact={data.personalInfo.contact}
                selectedSkillIds={data.selectedSkillIds}
                skills={data.skills}
                isReadOnly={isReadOnly}
              />
            </div>
          )}
          {data.isShowIntern && data.experiences.length > 0 && (
            <div id="experience-section">
              <ExperienceSection
                experiences={data.experiences}
                personalInfo={data.personalInfo}
                isReadOnly={isReadOnly}
              />
            </div>
          )}
          {data.isShowAward && data.awards.length > 0 && (
            <div id="award-section">
              <AwardsSection
                awards={data.awards}
                personalInfo={data.personalInfo}
                isReadOnly={isReadOnly}
              />
            </div>
          )}
          {data.isShowCertificate && data.certificates.length > 0 && (
            <div id="certificate-section">
              <CertificateSection
                certificates={data.certificates}
                personalInfo={data.personalInfo}
                isReadOnly={isReadOnly}
              />
            </div>
          )}

          {data.isShowTraining && data.trainings.length > 0 && (
            <div id="training-section">
              <TrainingSection
                trainings={data.trainings}
                personalInfo={data.personalInfo}
                isReadOnly={isReadOnly}
              />
            </div>
          )}
          {data.isShowThesis && data.projects.length > 0 && (
            <div id="project-section">
              <ProjectSection
                projects={data.projects}
                personalInfo={data.personalInfo}
                isReadOnly={isReadOnly}
              />
            </div>
          )}
          {data.isShowActivity && data.activities.length > 0 && (
            <div id="activity-section">
              <ActivitiesSection
                activities={data.activities}
                personalInfo={data.personalInfo}
                isReadOnly={isReadOnly}
              />
            </div>
          )}
          {data.isShowPersonal &&
            (data.personalInfo.contact.email ||
              data.personalInfo.contact.phone ||
              data.personalInfo.contact.github ||
              data.personalInfo.contact.linkedin) && (
              <Footer contact={data.personalInfo.contact} />
            )}
        </div>
      </div>
    </ThemeProvider>
  );
};
