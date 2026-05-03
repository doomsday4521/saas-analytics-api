import api from './client'

// Auth
export const login = (data) => api.post('/auth/login', data).then(r => r.data)
export const register = (data) => api.post('/auth/register', data).then(r => r.data)
export const logout = (refresh_token) => api.post('/auth/logout', { refresh_token })

// Usage
export const getUsageLogs = (params) => api.get('/usage/logs', { params }).then(r => r.data)
export const getUsageSummary = (customerId) => api.get(`/usage/summary/${customerId}`).then(r => r.data)
export const getAnomalies = (limit = 100) => api.get('/usage/anomalies', { params: { limit } }).then(r => r.data)

// API Keys
export const getApiKeys = () => api.get('/api-keys').then(r => r.data)
export const createApiKey = (data) => api.post('/api-keys', data).then(r => r.data)
export const revokeApiKey = (id) => api.delete(`/api-keys/${id}`).then(r => r.data)

// Billing
export const getPlans = () => api.get('/billing/plans').then(r => r.data)
export const subscribeToPlan = (planId) => api.post(`/billing/subscribe/${planId}`).then(r => r.data)
export const generateInvoice = () => api.post('/billing/invoices/generate').then(r => r.data)
export const getInvoices = () => api.get('/billing/invoices').then(r => r.data)

// Webhooks
export const getWebhooks = () => api.get('/webhooks').then(r => r.data)
export const createWebhook = (data) => api.post('/webhooks', data).then(r => r.data)
export const deleteWebhook = (id) => api.delete(`/webhooks/${id}`).then(r => r.data)
export const getCurrentPlan = () => api.get('/billing/current-plan').then(r => r.data)

export const finalizeInvoice = (invoiceId) => api.post(`/billing/invoices/${invoiceId}/finalize`).then(r => r.data)