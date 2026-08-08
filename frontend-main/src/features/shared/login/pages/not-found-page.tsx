import React from "react";
import { Result, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { HomeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useAuth } from "../../../../hooks/use-auth";
import Button from "../../../../components/button/button";

const { Text } = Typography;

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { roles, userData } = useAuth();

  // คำนวณหาหน้าหลักตาม Role
  const getHomePath = () => {
    return roles.includes("TEACHER") ? "/teacher" : "/student";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm max-w-[500px] w-full">
        <Result
          status="404"
          title={<span className="text-2xl font-bold">404</span>}
          subTitle={
            <div className="space-y-2">
              <h2 className="text-xl font-bold">ไม่พบหน้าที่คุณต้องการ</h2>
            </div>
          }
          extra={[
            <Button
              key="home"
              // type="primary"
              // icon={<HomeOutlined />}
              onClick={() => navigate(getHomePath())}
              className="bg-blue-600 hover:scale-105 transition-transform"
            >
              กลับหน้าหลัก
            </Button>,
          ]}
        />
      </div>
    </div>
  );
};

export default NotFoundPage;
