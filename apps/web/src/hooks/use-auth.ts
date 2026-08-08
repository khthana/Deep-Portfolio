import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [roles, setRoles] = useState<string[]>([]);
  const [userData, setUserData] = useState<any>();

  const handleVerifyToken = async () => {
    try {
      const login = await axiosInstance.get(endpoints.auth.login);

      if (login.status === 200) {
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
