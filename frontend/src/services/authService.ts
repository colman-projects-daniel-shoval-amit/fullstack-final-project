export const authService = {
  loginWithGoogle(): void {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  },
};
