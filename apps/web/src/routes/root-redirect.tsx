import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../hooks/use-auth";
import { paths } from "./paths.config";

/**
 * What "/" means, which depends on who is asking.
 *
 * There was no route for "/" at all before — the site was only ever entered
 * through a link from DEEP Core, so the bare domain fell through to the 404
 * page. It is the first thing anyone types now, so it has to answer.
 */
const RootRedirect = () => {
  const { isAuthenticated, isLoading, roles } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace />;
  }

  // Teacher first, deliberately: someone holding both roles is here to teach.
  if (roles.includes("TEACHER")) {
    return <Navigate to={paths.teacher.root} replace />;
  }

  if (roles.includes("STUDENT")) {
    return <Navigate to={paths.student.root} replace />;
  }

  // Unreachable today — useAuth reports a user with no roles as not
  // authenticated — but the fallback has to go somewhere, and 403 is the
  // honest answer for an account that exists with nothing to do.
  return <Navigate to={paths.unauthorized} replace />;
};

export default RootRedirect;
