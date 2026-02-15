import api from './api';

/**
 * KYC API - All KYC document upload and verification API calls
 */
export const kycApi = {
  // Get KYC status
  getKycStatus: async () => {
    const response = await api.get('/api/v1/kyc/status');
    return response.data;
  },

  // Upload KYC document
  uploadDocument: async (documentType, file, documentNumber) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (documentNumber) {
      formData.append('documentNumber', documentNumber);
    }
    const response = await api.post('/api/v1/kyc/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload Aadhaar Front
  uploadAadhaarFront: async (file) => {
    return kycApi.uploadDocument('AADHAAR_FRONT', file);
  },

  // Upload Aadhaar Back
  uploadAadhaarBack: async (file) => {
    return kycApi.uploadDocument('AADHAAR_BACK', file);
  },

  // Upload PAN
  uploadPan: async (file) => {
    return kycApi.uploadDocument('PAN', file);
  },

  // Upload Bank Cheque/Passbook
  uploadBankCheque: async (file) => {
    return kycApi.uploadDocument('BANK_CHEQUE', file);
  },

  // Verify Aadhaar
  verifyAadhaar: async (aadhaarNumber) => {
    const response = await api.post('/api/v1/kyc/verify/aadhaar', { aadhaarNumber });
    return response.data;
  },

  // Verify PAN
  verifyPan: async (panNumber) => {
    const response = await api.post('/api/v1/kyc/verify/pan', { panNumber });
    return response.data;
  },

  // Verify Bank Account
  verifyBankAccount: async (accountNumber, ifscCode) => {
    const response = await api.post('/api/v1/kyc/verify/bank', { accountNumber, ifscCode });
    return response.data;
  },

  // Submit KYC for review
  submitKyc: async () => {
    const response = await api.post('/api/v1/kyc/submit');
    return response.data;
  },

  // Get document status
  getDocumentStatus: async (documentType) => {
    const response = await api.get(`/api/v1/kyc/document/${documentType}/status`);
    return response.data;
  },

  // Delete document
  deleteDocument: async (documentType) => {
    const response = await api.delete(`/api/v1/kyc/document/${documentType}`);
    return response.data;
  },

  // Resend OTP for verification
  resendVerificationOtp: async (documentType) => {
    const response = await api.post('/api/v1/kyc/verify/otp/resend', { documentType });
    return response.data;
  },

  // Verify OTP
  verifyOtp: async (documentType, otp) => {
    const response = await api.post('/api/v1/kyc/verify/otp', { documentType, otp });
    return response.data;
  },

  // Get rejected documents
  getRejectedDocuments: async () => {
    const response = await api.get('/api/v1/kyc/documents/rejected');
    return response.data;
  },

  // Get pending documents
  getPendingDocuments: async () => {
    const response = await api.get('/api/v1/kyc/documents/pending');
    return response.data;
  },
};

export default kycApi;
