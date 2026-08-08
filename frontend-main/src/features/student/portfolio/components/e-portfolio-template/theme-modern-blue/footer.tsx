import {
  MailOutlined,
  LinkedinFilled,
  GithubFilled,
  PhoneFilled,
} from "@ant-design/icons";
import type { ContactInfo } from "../types";

interface FooterProps {
  contact: ContactInfo;
}

export const Footer: React.FC<FooterProps> = ({ contact }) => (
  <footer
    className="text-white py-16"
    style={{ backgroundColor: "var(--port-primary)" }}
  >
    <div className="max-w-7xl mx-auto px-8 text-center space-y-8">
      <h2 className="header-3">ช่องทางการติดต่อ</h2>

      <div className="flex flex-wrap justify-center gap-6 mb-8 items-center">
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="bg-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
            style={{ color: "var(--port-primary)" }}
          >
            <MailOutlined className="text-xl" />
            {contact.email}
          </a>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="bg-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
            style={{ color: "var(--port-primary)" }}
          >
            <PhoneFilled className="text-xl" />
            {contact.phone}
          </a>
        )}
        {(contact.linkedin || contact.github) && (
          <div className="flex gap-4">
            {contact.linkedin && (
              <a
                href={contact.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                style={{ color: "var(--port-primary)" }}
              >
                <LinkedinFilled className="text-2xl" />
              </a>
            )}
            {contact.github && (
              <a
                href={contact.github}
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
    </div>
  </footer>
);
