// Manages document request state: fetching, creating, and status updates.
// Used on citizen dashboard (track own requests) and admin-service dashboard (manage all).
//
// Usage:
//   const { requests, loading, error, createRequest } = useDocumentRequest()

import { useState, useEffect } from 'react'
import * as documentService from '../services/documentService'

export function useDocumentRequest(userId = null) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // TODO: fetch requests based on userId (citizen) or all requests (admin)
  }, [userId])

  async function createRequest(payload) {
    // TODO: implement
  }

  async function updateStatus(requestId, status, notes) {
    // TODO: implement
  }

  return { requests, loading, error, createRequest, updateStatus }
}
