import { Dropdown, Avatar, type MenuProps, message } from "antd";
import { UserOutlined, LogoutOutlined, SwapOutlined } from "@ant-design/icons";
import { paths } from "../../routes/paths.config";
import { Link } from "react-router-dom";
import { endpoints } from "../../configs/endpoints.config";
import { axiosInstance } from "../../lib/axios";

const TeacherInfoDropdown = () => {
  const handleLogout = async () => {
    try {
      await axiosInstance.post(endpoints.auth.logout);
      message.success("กำลังออกจากระบบ...");
    } catch (error) {
      console.error("Logout failed:", error);
      message.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    } finally {
      // Either way. A logout that failed still means the person wanted out, and
      // a full reload is what clears the state this app keeps in memory.
      window.location.href = paths.login;
    }
  };

  const items: MenuProps["items"] = [
    {
      // A link to a neighbouring product, not a login route. DEEP Core is still
      // a separate system; what issue #11 removed is the SSO handshake, not the
      // fact that teachers move between the two.
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
