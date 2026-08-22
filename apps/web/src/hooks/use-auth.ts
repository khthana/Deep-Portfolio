import { useState, useEffect } from "react";
import type { SessionUser } from "@deep-portfolio/api-types";
import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";
import type { ResponseWrapper } from "../types/global-type";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // The list the API sends, entries and all: `user_roles.role_id` is nullable,
  // so a row that assigns no role puts a null here. Nothing matches it — the
  // guards compare against "TEACHER" and "STUDENT" — and dropping it would be
  // a change to what the endpoint answers rather than to how it is read (#68).
  const [roles, setRoles] = useState<SessionUser["roles"]>([]);
  const [userData, setUserData] = useState<SessionUser>();

  // One request, not two. This used to call GET /auth/login first to have DEEP
  // Core's SSO cookie exchanged for a session on every page load; sessions are
  // now minted once, at the login page, so all that is left to ask is whether
  // the cookie the browser already holds is still good for one.
  const handleVerifyToken = async () => {
    try {
      const { data } = await axiosInstance.get<ResponseWrapper<SessionUser>>(
        endpoints.auth.root,
      );

      const user = data.data;
      const userRoles = user.roles || [];
      if (userRoles.length > 0) {
        setRoles(userRoles);
        setIsAuthenticated(true);
        setUserData(user);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleVerifyToken();
  }, []);

  return { isAuthenticated, isLoading, roles, userData };
};
