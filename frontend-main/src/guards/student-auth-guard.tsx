import React from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../hooks/use-auth";
import { paths } from "../routes/paths.config";

type AuthGuardProps = {
  children: React.ReactNode;
};

const StudentAuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading, roles } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "https://deep-core.net/";
    return null;
  }

  if (!roles.includes("STUDENT")) {
    return <Navigate to={paths.unauthorized} replace />;
  }

  return <>{children}</>;
};

export default StudentAuthGuard;
