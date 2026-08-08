import prisma from "../config/prisma";

export default class AuthService {
  async getUserDetail(user_id: string) {
    try {
      const user = await prisma.users.findUnique({
        where: { user_id },
        select: {
          user_id: true,
          email: true,
          title_th: true,
          first_name_th: true,
          last_name_th: true,
          first_name_en: true,
          last_name_en: true,
          user_roles_user_roles_user_idTousers: {
            where: {
              is_active: true,
            },
            select: {
              role_id: true,
            },
          },
        },
      });

      if (!user) return null;

      return {
        user_id: user.user_id,
        email: user.email,
        name: `${user.title_th} ${user.first_name_th} ${user.last_name_th}`,
        roles: user.user_roles_user_roles_user_idTousers.map((r) => r.role_id),
      };
    } catch (error) {
      throw new Error("Failed to fetch user profile");
    }
  }
}
