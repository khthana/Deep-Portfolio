import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import StudentNavbar from "../components/layout/student-navbar";
import StudentSideBar from "../components/layout/student-side-bar";

const StudentLayout: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  if (currentPath === "/student/") {
    return <Navigate to="/student" replace />;
  }

  return (
    <div className="flex flex-col h-screen">
      <StudentNavbar />
      <div className="flex flex-1 overflow-hidden">
        <StudentSideBar />
        <main className="flex-1 overflow-y-auto 2xl:px-20 2xl:py-8 px-10 pt-4 pb-20 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
