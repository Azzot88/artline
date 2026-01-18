export class APIError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data?: any) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

const BASE_URL = "/api";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    const config = {
        credentials: "include",
        ...options,
        headers,
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
        // Basic redirect to auth page if 401
        // But only if we are not already on auth page to avoid loops
        if (!window.location.pathname.startsWith("/auth")) {
            // window.location.href = "/auth/login"; 
            // Ideally we use a callback or event, but for prototype this is fine.
            // Actually, the backend might handle redirects, but for an SPA we usually want to handle it.
            // Let's throw for now and let the caller or global boundary handle it.
        }
    }

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { message: response.statusText };
        }
        throw new APIError(errorData.detail || errorData.message || "An error occurred", response.status, errorData);
    }

    // Handle empty responses (like 204)
    if (response.status === 204) {
        return {} as T;
    }

    try {
        return await response.json();
    } catch (e) {
        // Return empty if parsing failed but response was OK (rare)
        return {} as T;
    }
}

export const api = {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),
    post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
    put: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
    delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
