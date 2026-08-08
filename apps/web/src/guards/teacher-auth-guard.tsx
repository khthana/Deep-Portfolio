import React from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../hooks/use-auth";
import { paths } from "../routes/paths.config";

type AuthGuardProps = {
  children: React.ReactNode;
};

const TeacherAuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading, roles } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Not signed in is a different thing from signed in without the role: one is
  // fixed by logging in, the other never is. The two guards disagreed about
  // this before — the student one left the site entirely, this one showed 403.
  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace />;
  }

  if (!roles.includes("TEACHER")) {
    return <Navigate to={paths.unauthorized} replace />;
  }

  return <>{children}</>;
};

export default TeacherAuthGuard;
