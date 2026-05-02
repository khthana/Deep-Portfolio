import type { PropsWithChildren } from "react";

const WhiteContainer: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="bg-white 2xl:p-8 p-6 rounded-2xl flex flex-col 2xl:gap-6 gap-4 w-full h-full">
      {children}
    </div>
  );
};

export default WhiteContainer;
