export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  fullName: string;
  username: string;
  token: string;
}

export interface ApiError {
  message: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl;
  }

  private getHeaders(token?: string | null): HeadersInit {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      const error: ApiError = await res.json().catch(() => ({
        message: "Login failed. Please try again.",
      }));
      throw new Error(error.message);
    }

    return res.json();
  }

  async logout(token?: string | null): Promise<void> {
    await fetch(`${this.baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: this.getHeaders(token),
    });
  }
}

export const api = new ApiClient();
