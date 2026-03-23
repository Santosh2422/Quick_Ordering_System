import api from "./api";

export interface AnalyticsParams {
    filter?: string;
    startDate?: string;
    endDate?: string;
}

const analyticsService = {
    getTopSellingItems: async (params: AnalyticsParams) => {
        const response = await api.get("/analytics/top-selling", { params });
        return response.data;
    },

    getTotalRevenue: async (params: AnalyticsParams) => {
        const response = await api.get("/analytics/total-revenue", { params });
        return response.data;
    },

    getSlowMovers: async (params: AnalyticsParams) => {
        const response = await api.get("/analytics/slow-movers", { params });
        return response.data;
    },

    getHighRevenueItems: async (params: AnalyticsParams) => {
        const response = await api.get("/analytics/high-revenue-items", { params });
        return response.data;
    },

    getCategoryWiseQuantity: async (params: AnalyticsParams) => {
        const response = await api.get("/analytics/get-top-category-wise-quantity", { params });
        return response.data;
    },

    getCategoryWiseRevenue: async (params: AnalyticsParams) => {
        const response = await api.get("/analytics/get-top-category-wise-revenue", { params });
        return response.data;
    },

    getTableTurnaroundTime: async (params: AnalyticsParams) => {
        const response = await api.get("/analytics/get-table-turnaround-time", { params });
        return response.data;
    },

    getBusiestTables: async (params: AnalyticsParams) => {
        const response = await api.get("/analytics/get-table-stats", { params });
        return response.data;
    },
};

export default analyticsService;
