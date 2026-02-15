import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  kycStatus: 'PENDING', // PENDING, VERIFIED, REJECTED, UNDER_REVIEW
  documents: {
    aadhaar: { status: 'PENDING', frontImage: null, backImage: null },
    pan: { status: 'PENDING', frontImage: null },
    bankAccount: { status: 'PENDING', chequeImage: null },
  },
  rejectionReason: null,
  loading: false,
  uploading: false,
  uploadProgress: 0,
  error: null,
};

// Upload KYC document
export const uploadKycDocument = createAsyncThunk(
  'kyc/uploadDocument',
  async ({ documentType, file, documentNumber }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      if (documentNumber) {
        formData.append('documentNumber', documentNumber);
      }

      const response = await fetch('/api/v1/kyc/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload document');
    }
  }
);

// Fetch KYC status
export const fetchKycStatus = createAsyncThunk(
  'kyc/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/kyc/status');
      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch KYC status');
    }
  }
);

// Submit KYC for verification
export const submitKyc = createAsyncThunk(
  'kyc/submit',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/kyc/submit', {
        method: 'POST',
      });
      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit KYC');
    }
  }
);

// Verify bank account
export const verifyBankAccount = createAsyncThunk(
  'kyc/verifyBankAccount',
  async ({ accountNumber, ifscCode }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/kyc/verify-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber, ifscCode }),
      });
      return response.json();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify bank account');
    }
  }
);

const kycSlice = createSlice({
  name: 'kyc',
  initialState,
  reducers: {
    setDocumentImage: (state, action) => {
      const { documentType, side, image } = action.payload;
      if (state.documents[documentType]) {
        if (side) {
          state.documents[documentType][side] = image;
        } else {
          state.documents[documentType].frontImage = image;
        }
      }
    },
    clearDocument: (state, action) => {
      const { documentType, side } = action.payload;
      if (state.documents[documentType]) {
        if (side) {
          state.documents[documentType][side] = null;
        } else {
          state.documents[documentType] = { status: 'PENDING', frontImage: null, backImage: null };
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetKyc: (state) => {
      state.kycStatus = 'PENDING';
      state.documents = {
        aadhaar: { status: 'PENDING', frontImage: null, backImage: null },
        pan: { status: 'PENDING', frontImage: null },
        bankAccount: { status: 'PENDING', chequeImage: null },
      };
      state.rejectionReason = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload Document
      .addCase(uploadKycDocument.pending, (state) => {
        state.uploading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadKycDocument.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 100;
        const { documentType } = action.payload;
        if (state.documents[documentType]) {
          state.documents[documentType].status = 'UPLOADED';
        }
        state.kycStatus = 'UNDER_REVIEW';
      })
      .addCase(uploadKycDocument.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })
      // Fetch Status
      .addCase(fetchKycStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchKycStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.kycStatus = action.payload.status;
        state.documents = action.payload.documents || state.documents;
        state.rejectionReason = action.payload.rejectionReason;
      })
      .addCase(fetchKycStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit KYC
      .addCase(submitKyc.fulfilled, (state, action) => {
        state.kycStatus = 'UNDER_REVIEW';
      })
      // Verify Bank Account
      .addCase(verifyBankAccount.fulfilled, (state, action) => {
        state.documents.bankAccount.status = 'VERIFIED';
      });
  },
});

export const { setDocumentImage, clearDocument, clearError, resetKyc } = kycSlice.actions;
export default kycSlice.reducer;
