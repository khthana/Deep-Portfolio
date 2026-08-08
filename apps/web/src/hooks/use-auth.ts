import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [roles, setRoles] = useState<string[]>([]);
  const [userData, setUserData] = useState<any>();

  // One request, not two. This used to call GET /auth/login first to have DEEP
  // Core's SSO cookie exchanged for a session on every page load; sessions are
  // now minted once, at the login page, so all that is left to ask is whether
  // the cookie the browser already holds is still good for one.
  const handleVerifyToken = async () => {
    try {
      const { data } = await axiosInstance.get(endpoints.auth.root);

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
