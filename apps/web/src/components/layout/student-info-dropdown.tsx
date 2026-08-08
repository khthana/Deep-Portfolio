import { Dropdown, Avatar, type MenuProps, message } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { paths } from "../../routes/paths.config";
import { Link } from "react-router-dom";
import { endpoints } from "../../configs/endpoints.config";
import { axiosInstance } from "../../lib/axios";
import { useSelector } from "react-redux";
import type { RootState } from "../../stores/stores";
import { getFile } from "../../utils/get-file";

const StudentInfoDropdown = () => {
  const { portfolioPersonal } = useSelector((state: RootState) => state.home);
  const imageUrl = portfolioPersonal?.attachments?.url;

  const handleLogout = async () => {
    try {
      await axiosInstance.post(endpoints.auth.logout);
      window.location.href = "https://deep-core.net/";

      message.success("กำลังออกจากระบบ...");
    } catch (error) {
      console.error("Logout failed:", error);
      message.error("เกิดข้อผิดพลาดในการออกจากระบบ");
      window.location.href = "https://deep-core.net/";
    }
  };

  const items: MenuProps["items"] = [
    {
      key: "profile",
      label: (
        <Link to={paths.student.portfolio.personalDetails}>
          ข้อมูลผู้ใช้งาน
        </Link>
      ),
      icon: <UserOutlined />,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "ออกจากระบบ",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout, // ใส่ onClick ตรงนี้เลยสะดวกกว่า
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <Avatar
        className="cursor-pointer hover:opacity-80 transition-opacity"
        size={{ xs: 32, sm: 32, md: 32, lg: 32, xxl: 40 }}
        src={imageUrl ? getFile(imageUrl) : undefined}
        icon={<UserOutlined />}
        style={{ objectFit: "cover" }}
      />
    </Dropdown>
  );
};

export default StudentInfoDropdown;
