import type React from "react";
import WhiteContainer from "../../../../components/container/white-container";
import type { PropsWithChildren } from "react";
import BackButton from "../../../../components/button/back-button";

type Props = {
  title: string;
  backHref: string;
};

const CreateSectionLayout: React.FC<PropsWithChildren<Props>> = ({
  title,
  backHref,
  children,
}) => {
  return (
    <WhiteContainer>
      <div className="pb-5 border-b border-light-grey">
        <BackButton title={title} href={backHref} color="black" />
      </div>

      {children}
    </WhiteContainer>
  );
};

export default CreateSectionLayout;
