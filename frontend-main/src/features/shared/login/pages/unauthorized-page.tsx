import React from "react";
import { Result, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { HomeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useAuth } from "../../../../hooks/use-auth";
import Button from "../../../../components/button/button";

const { Text } = Typography;

const UnauthorizedPage: React.FC = () => {
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
          status="403"
          title={<span className="text-2xl font-bold">403</span>}
          subTitle={
            <div className="space-y-2">
              <p className="text-gray-600">
                ขออภัย คุณไม่มีสิทธิ์เข้าถึงเนื้อหาในส่วนนี้
              </p>
              {/* {userData && (
                <div className="bg-gray-50 p-2 rounded border border-dashed border-gray-300">
                  <Text type="secondary" className="text-xs">
                    Logged in as:{" "}
                    <span className="font-semibold text-blue-600">
                      {userData.user_id}
                    </span>
                  </Text>
                  <br />
                  <Text type="secondary" className="text-xs">
                    Current Roles:{" "}
                    <span className="font-semibold">
                      {userData.roles.join(", ")}
                    </span>
                  </Text>
                </div>
              )} */}
            </div>
          }
          extra={[
            // <Button
            //   key="back"
            //   // icon={<ArrowLeftOutlined />}
            //   onClick={() => navigate(-1)}
            //   className="hover:scale-105 transition-transform"
            // >
            //   ย้อนกลับ
            // </Button>,
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

export default UnauthorizedPage;
