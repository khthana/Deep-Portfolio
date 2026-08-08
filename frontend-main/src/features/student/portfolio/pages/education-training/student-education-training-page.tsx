import { Breadcrumb } from "antd";
import { useEffect, useState } from "react";
import EducationSection from "../../components/education-training/education-section";
import TrainingSection from "../../components/education-training/training-section";
import CertificateSection from "../../components/education-training/certificate-section";
import PageLayout from "../../../../../components/container/page-layout";
import { getAllPortfolioEducation } from "../../../../../services/portfolio-education.service";
import { getAllPortfolioTraining } from "../../../../../services/portfolio-training.service";
import { getAllPortfolioCertificate } from "../../../../../services/portfolio-certificate.service";
import type { PortfolioEducationResp } from "../../../../../types/portfolio-education-type.type";
import type { PortfolioTrainingResp } from "../../../../../types/portfolio-training-type.type";
import type { PortfolioCertificateResp } from "../../../../../types/portfolio-certificate-type.type";

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

const StudentEducationTrainingPage = () => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const [educationList, setEducationList] = useState<PortfolioEducationResp[]>(
    [],
  );
  const [trainingList, setTrainingList] = useState<PortfolioTrainingResp[]>([]);
  const [certificateList, setCertificateList] = useState<
    PortfolioCertificateResp[]
  >([]);

  const fetchData = async () => {
    if (!studentId) return;
    try {
      if (studentId === "") return;

      const [educationResp, trainingResp, certificateResp] = await Promise.all([
        getAllPortfolioEducation(studentId),
        getAllPortfolioTraining(studentId),
        getAllPortfolioCertificate(studentId),
      ]);

      if (educationResp.data) {
        setEducationList(educationResp.data);
      }
      if (trainingResp.data) {
        setTrainingList(trainingResp.data);
      }
      if (certificateResp.data) {
        setCertificateList(certificateResp.data);
      }
    } catch (error) {
      console.error("Error fetching education and training:", error);
    }
  };

  useEffect(() => {
    console.log("student id : ", studentId);
    fetchData();
  }, [studentId]);

  return (
    <PageLayout>
      <Breadcrumb
        className="breadcrumb-bold"
        separator=">"
        items={[
          {
            title: "แฟ้มผลงาน",
          },
          {
            title: "การศึกษาและการอบรม",
          },
        ]}
      />

      <EducationSection data={educationList} onRefresh={fetchData} />
      <TrainingSection data={trainingList} onRefresh={fetchData} />
      <CertificateSection data={certificateList} onRefresh={fetchData} />
    </PageLayout>
  );
};

export default StudentEducationTrainingPage;
