import { useNavigate } from "react-router-dom";
import { paths } from "../../../../../routes/paths.config";
import SectionLayout from "../section-layout";
import EPortfolioTable from "./e-portfolio-table";

const EPortfolioSection = () => {
  const navigate = useNavigate();

  return (
    <SectionLayout
      title="e-Portfolio"
      onClick={() => navigate(paths.student.portfolio.ePortfolio.add)}
    >
      <EPortfolioTable />
    </SectionLayout>
  );
};

export default EPortfolioSection;
