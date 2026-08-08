import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import TeacherSideBar from "../components/layout/teacher-side-bar";
import { paths } from "../routes/paths.config";
import TeacherNavbar from "../components/layout/teacher-navbar";

const TeacherLayout: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  if (currentPath === "/teacher/") {
    return <Navigate to="/teacher" replace />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TeacherNavbar />
      {currentPath !== paths.teacher.root ? (
        <div className="flex flex-1 overflow-hidden">
          <TeacherSideBar />

          <main className="flex-1 overflow-y-auto 2xl:px-20 2xl:py-8 px-10 pt-4 pb-20">
            <div className="min-h-full">
              <Outlet />
            </div>
          </main>
        </div>
      ) : (
        <main className="flex justify-center overflow-y-auto 2xl:py-8 pt-4 pb-20 w-full">
          <Outlet />
        </main>
      )}
    </div>
  );
};

export default TeacherLayout;
