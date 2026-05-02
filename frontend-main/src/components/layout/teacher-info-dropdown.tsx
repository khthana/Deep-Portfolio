import { Dropdown, Avatar, type MenuProps, message } from "antd";
import { UserOutlined, LogoutOutlined, SwapOutlined } from "@ant-design/icons";
import { paths } from "../../routes/paths.config";
import { Link } from "react-router-dom";
import axios from "axios";
import { endpoints } from "../../configs/endpoints.config";
import { axiosInstance } from "../../lib/axios";

const TeacherInfoDropdown = () => {
  // const handleLogout = async () => {
  //   try {
  //     await axiosInstance.post(endpoints.auth.logout);

  //     message.success("กำลังออกจากระบบ...");

  //     window.location.href = "https://deep-core.net/";
  //   } catch (error) {
  //     console.error("Logout failed:", error);
  //     message.error("เกิดข้อผิดพลาดในการออกจากระบบ");

  //     // window.location.href = "https://deep-core.net/";
  //   }
  // };
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
      key: "deep-core",
      label: <Link to="https://deep-core.net/">DEEP-QA</Link>,
      icon: <SwapOutlined />,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "ออกจากระบบ",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <Avatar
        className="cursor-pointer hover:opacity-80 transition-opacity"
        size={{ xs: 32, sm: 32, md: 32, lg: 32, xxl: 40 }}
        icon={<UserOutlined />}
      />
    </Dropdown>
  );
};

export default TeacherInfoDropdown;
