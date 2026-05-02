import { Breadcrumb } from "antd";
import ImageSection from "../../components/personal-details/image-section";
import PersonalDetailsSection from "../../components/personal-details/personal-details-section";
import PageLayout from "../../../../../components/container/page-layout";

import { useEffect, useState } from "react";
import PersonalDetailsEditModal from "../../components/personal-details/personal-details-edit-modal";
import { getUser } from "../../../../../services/user.service";
import { getPortfolioPersonal } from "../../../../../services/portfolio-personal.service";
import type { UserResp } from "../../../../../types/user-type.type";
import type { PortfolioPersonalResp } from "../../../../../types/portfolio-personal-type.type";

import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../../stores/stores";
import { homeSliceAction } from "../../../../../features/student/home/stores/home-slice";

const StudentPersonalDetailsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { studentId } = useSelector((state: RootState) => state.home);
  const [user, setUser] = useState<UserResp | null>(null);
  const [portfolioPersonal, setPortfolioPersonal] =
    useState<PortfolioPersonalResp | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    if (!studentId) return;
    try {
      if (studentId == "") return;

      const [userRes, portfolioRes] = await Promise.all([
        getUser(studentId),
        getPortfolioPersonal(studentId),
      ]);
      setUser(userRes.data);
      setPortfolioPersonal(portfolioRes.data);
      // Sync to Redux store for global navbar/sidebar updates
      dispatch(homeSliceAction.setPortfolioPersonal(portfolioRes.data));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
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
            title: "ข้อมูลส่วนตัว",
          },
        ]}
      />

      <div className="w-full">
        <PersonalDetailsSection
          user={user}
          portfolioPersonal={portfolioPersonal}
          imageUrl={portfolioPersonal?.attachments?.url}
          onEdit={() => setIsModalOpen(true)}
        />
      </div>

      <PersonalDetailsEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        initialData={{ user, portfolioPersonal }}
      />
    </PageLayout>
  );
};

export default StudentPersonalDetailsPage;
