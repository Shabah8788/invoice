import { base44 } from "@/api/base44Client";

export const authService = {
  getCurrentUser() {
    return base44.auth.me();
  },
  login(email, password) {
    return base44.auth.login(email, password);
  },
  register(email, password) {
    return base44.auth.register(email, password);
  },
  logout() {
    return base44.auth.logout();
  },
};

export default authService;
