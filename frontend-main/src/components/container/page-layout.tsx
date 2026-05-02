import type { PropsWithChildren } from "react";
import type React from "react";

const PageLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className="flex flex-col 2xl:gap-6 gap-3 pb-5">{children}</div>;
};

export default PageLayout;
