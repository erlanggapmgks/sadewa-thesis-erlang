// Wraps authService functions with React state (loading, error).
// Use this hook inside components — it handles async state so components stay clean.
//
// Usage:
//   const { login, logout, loading, error } = useAuth()

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authService from '../services/authService'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function login(email, password) {
    // TODO: implement
  }

  async function logout() {
    // TODO: implement
  }

  return { login, logout, loading, error }
}
