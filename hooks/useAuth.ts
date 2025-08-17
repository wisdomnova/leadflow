import { useAuthStore } from '@/store/useAuthStore'

export const useAuth = () => {
  const { user, loading, signUp, signIn, signOut, checkAuth } = useAuthStore()
  
  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    checkAuth
  }
}