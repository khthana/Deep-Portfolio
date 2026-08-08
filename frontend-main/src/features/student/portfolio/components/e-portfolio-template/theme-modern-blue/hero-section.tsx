import {
  MailOutlined,
  LinkedinFilled,
  GithubFilled,
  PhoneFilled,
} from "@ant-design/icons";
import type { PersonalInfo } from "../types";
import { getFile } from "../../../../../../utils/get-file";

interface HeroSectionProps {
  personalInfo: PersonalInfo;
  about_me?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  personalInfo,
  about_me,
}) => (
  <div
    className="text-white pb-16 px-8 mx-16 max-w-8xl mt-24"
    style={{ backgroundColor: "var(--port-primary)" }}
  >
    <div className="flex flex-col items-center gap-8">
      <div className="w-72 h-72 rounded-full border-4 border-gray-300 overflow-hidden bg-white -mt-24 flex items-center justify-center shadow-lg">
        <img
          src={
            personalInfo.profileImageUrl
              ? getFile(personalInfo.profileImageUrl)
              : "/assets/user/fallback-user.png"
          }
          alt="Profile"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="text-center">
        <h1 className="header-2">{personalInfo.fullName}</h1>
        {about_me && (
          <p className="caption-regular max-w-4xl mx-auto mb-6 leading-relaxed">
            "{about_me}"
          </p>
        )}

        {(personalInfo.contact.email ||
          personalInfo.contact.phone ||
          personalInfo.contact.linkedin ||
          personalInfo.contact.github) && (
          <div className="flex gap-6 justify-center items-center">
            {personalInfo.contact.email && (
              <a
                href={`mailto:${personalInfo.contact.email}`}
                className="bg-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
                style={{ color: "var(--port-primary)" }}
              >
                <MailOutlined className="text-xl" />
                {personalInfo.contact.email}
              </a>
            )}

            {personalInfo.contact.phone && (
              <a
                href={`tel:${personalInfo.contact.phone}`}
                className="bg-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
                style={{ color: "var(--port-primary)" }}
              >
                <PhoneFilled className="text-xl" />
                {personalInfo.contact.phone}
              </a>
            )}

            {(personalInfo.contact.linkedin || personalInfo.contact.github) && (
              <div className="flex gap-4">
                {personalInfo.contact.linkedin && (
                  <a
                    href={personalInfo.contact.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    style={{ color: "var(--port-primary)" }}
                  >
                    <LinkedinFilled className="text-2xl" />
                  </a>
                )}
                {personalInfo.contact.github && (
                  <a
                    href={personalInfo.contact.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    style={{ color: "var(--port-primary)" }}
                  >
                    <GithubFilled className="text-2xl" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);
