import { useState, useCallback } from 'react'

export const useAuthModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [redirectPath, setRedirectPath] = useState(null)

  const openAuthModal = useCallback((redirectTo = null) => {
    setRedirectPath(redirectTo)
    setIsModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsModalOpen(false)
    setRedirectPath(null)
  }, [])

  return {
    isModalOpen,
    redirectPath,
    openAuthModal,
    closeAuthModal
  }
}