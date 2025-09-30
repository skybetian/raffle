import apiClient from './client';

// TypeScript interfaces for type safety
export interface Winner {
  id?: number;
  playerUsername: string;
  raffleId: string;
  date: string;
  timestamp: string;
  notified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWinnerRequest {
  playerUsername: string;
  raffleId: string;
  date?: string;
  timestamp?: string;
}

export interface GetWinnersParams {
  page?: number;
  limit?: number;
  playerUsername?: string;
  raffleId?: string;
  date?: string;
}

export interface GetWinnersResponse {
  winners: Winner[];
  totalPages: number;
  currentPage: number;
  totalWinners: number;
}

export interface NotifyWinnerResponse {
  message: string;
  winner: Winner;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
}

// Raffle Winners API service
export const raffleAPI = {
  // Create new raffle winner
  async create(winnerData: CreateWinnerRequest): Promise<APIResponse<Winner>> {
    try {
      const response = await apiClient.post<Winner>('/raffle/winners', winnerData);
      return { success: true, data: response.data };
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to create winner';
      return { 
        success: false, 
        message, 
        errors: error.response?.data?.errors 
      };
    }
  },

  // Get all raffle winners with pagination and filtering
  async getAll(params: GetWinnersParams = {}): Promise<APIResponse<GetWinnersResponse>> {
    try {
      const response = await apiClient.get<GetWinnersResponse>('/raffle/winners', { params });
      return { success: true, data: response.data };
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to fetch winners';
      return { success: false, message };
    }
  },

  // Get winner by ID
  async getById(id: number): Promise<APIResponse<Winner>> {
    try {
      const response = await apiClient.get<Winner>(`/raffle/winners/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to fetch winner';
      return { success: false, message };
    }
  },

  // Mark winner as notified
  async notifyWinner(id: number): Promise<APIResponse<NotifyWinnerResponse>> {
    try {
      const response = await apiClient.put<NotifyWinnerResponse>(`/raffle/winners/${id}/notify`);
      return { success: true, data: response.data };
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to notify winner';
      return { success: false, message };
    }
  },

  // Get winner statistics (additional helper method)
  async getStats(): Promise<APIResponse<any>> {
    try {
      const response = await apiClient.get('/raffle/winners/stats');
      return { success: true, data: response.data };
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to fetch statistics';
      return { success: false, message };
    }
  },

  // Export winners data (additional helper method)
  async exportWinners(dateFrom?: string, dateTo?: string): Promise<APIResponse<void>> {
    try {
      const params: any = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await apiClient.get('/raffle/winners/export', {
        params,
        responseType: 'blob' // Important for file download
      });
      
      // Create a download link and trigger download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
      const dateStr = timestamp[0];
      const timeStr = timestamp[1].split('.')[0].replace(/-/g, '');
      link.download = `raffle_winners_export_${dateStr}_${timeStr}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to export winners';
      return { success: false, message };
    }
  },

  // Bulk operations (additional helper methods)
  async bulkNotify(winnerIds: number[]): Promise<APIResponse<any>> {
    try {
      const response = await apiClient.post('/raffle/winners/bulk-notify', {
        winner_ids: winnerIds
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to bulk notify winners';
      return { success: false, message };
    }
  },

  // Delete winner (if needed)
  async delete(id: number): Promise<APIResponse<any>> {
    try {
      const response = await apiClient.delete(`/raffle/winners/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to delete winner';
      return { success: false, message };
    }
  }
};

export default raffleAPI;