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

export interface UserProfile {
  id: string;
  name: string;
  description?: string | null;
}

export interface CreateUserProfileRequest {
  name: string;
  description?: string | null;
}

export type UpdateUserProfileRequest = CreateUserProfileRequest;

export interface UserAccount {
  id: string;
  fullName: string;
  username: string;
  userProfileId: string;
  userProfileName: string;
}

export interface CreateUserAccountRequest {
  userProfileId: string;
  fullName: string;
  username: string;
  password: string;
}

export interface UpdateUserAccountRequest {
  fullName: string;
  username: string;
  password?: string;
  userProfileId?: string;
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

  private async parseOrThrow<T>(
    res: Response,
    fallbackMessage: string,
  ): Promise<T> {
    if (res.ok) {
      return (await res.json()) as T;
    }
    const error: ApiError = await res.json().catch(() => ({
      message: fallbackMessage,
    }));
    throw new Error(error.message || fallbackMessage);
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });

    return this.parseOrThrow<LoginResponse>(
      res,
      "Login failed. Please try again.",
    );
  }

  async logout(token?: string | null): Promise<void> {
    await fetch(`${this.baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: this.getHeaders(token),
    });
  }

  async listUserProfiles(token?: string | null): Promise<UserProfile[]> {
    const res = await fetch(`${this.baseUrl}/api/admin/user-profiles`, {
      method: "GET",
      headers: this.getHeaders(token),
    });
    return this.parseOrThrow<UserProfile[]>(
      res,
      "Failed to load user profiles.",
    );
  }

  async searchUserProfiles(
    token: string | null | undefined,
    q: string,
  ): Promise<UserProfile[]> {
    const res = await fetch(
      `${this.baseUrl}/api/admin/user-profiles/search-user-profiles?q=${encodeURIComponent(q)}`,
      {
        method: "GET",
        headers: this.getHeaders(token),
      },
    );
    return this.parseOrThrow<UserProfile[]>(
      res,
      "Failed to search user profiles.",
    );
  }

  async createUserProfile(
    token: string | null | undefined,
    body: CreateUserProfileRequest,
  ): Promise<UserProfile> {
    const res = await fetch(
      `${this.baseUrl}/api/admin/user-profiles/create-user-profile`,
      {
        method: "POST",
        headers: this.getHeaders(token),
        body: JSON.stringify(body),
      },
    );
    return this.parseOrThrow<UserProfile>(
      res,
      "Failed to create user profile.",
    );
  }

  async updateUserProfile(
    token: string | null | undefined,
    id: string,
    body: UpdateUserProfileRequest,
  ): Promise<UserProfile> {
    const res = await fetch(
      `${this.baseUrl}/api/admin/user-profiles/update-user-profile/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: this.getHeaders(token),
        body: JSON.stringify(body),
      },
    );
    return this.parseOrThrow<UserProfile>(
      res,
      "Failed to update user profile.",
    );
  }

  async suspendUserProfile(
    token: string | null | undefined,
    id: string,
  ): Promise<UserProfile> {
    const res = await fetch(
      `${this.baseUrl}/api/admin/user-profiles/suspend-user-profile/${encodeURIComponent(id)}`,
      {
        method: "POST",
        headers: this.getHeaders(token),
      },
    );
    return this.parseOrThrow<UserProfile>(
      res,
      "Failed to suspend user profile.",
    );
  }

  async listUserAccounts(token?: string | null): Promise<UserAccount[]> {
    const res = await fetch(`${this.baseUrl}/api/admin/user-accounts`, {
      method: "GET",
      headers: this.getHeaders(token),
    });
    return this.parseOrThrow<UserAccount[]>(
      res,
      "Failed to load user accounts.",
    );
  }

  async searchUserAccounts(
    token: string | null | undefined,
    q: string,
  ): Promise<UserAccount[]> {
    const res = await fetch(
      `${this.baseUrl}/api/admin/user-accounts/search-user-accounts?q=${encodeURIComponent(q)}`,
      {
        method: "GET",
        headers: this.getHeaders(token),
      },
    );
    return this.parseOrThrow<UserAccount[]>(
      res,
      "Failed to search user accounts.",
    );
  }

  async createUserAccount(
    token: string | null | undefined,
    body: CreateUserAccountRequest,
  ): Promise<UserAccount> {
    const res = await fetch(
      `${this.baseUrl}/api/admin/user-accounts/create-user-account`,
      {
        method: "POST",
        headers: this.getHeaders(token),
        body: JSON.stringify(body),
      },
    );
    return this.parseOrThrow<UserAccount>(
      res,
      "Failed to create user account.",
    );
  }

  async updateUserAccount(
    token: string | null | undefined,
    id: string,
    body: UpdateUserAccountRequest,
  ): Promise<UserAccount> {
    const res = await fetch(
      `${this.baseUrl}/api/admin/user-accounts/update-user-account/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: this.getHeaders(token),
        body: JSON.stringify(body),
      },
    );
    return this.parseOrThrow<UserAccount>(
      res,
      "Failed to update user account.",
    );
  }

  async suspendUserAccount(
    token: string | null | undefined,
    id: string,
  ): Promise<UserAccount> {
    const res = await fetch(
      `${this.baseUrl}/api/admin/user-accounts/suspend-user-account/${encodeURIComponent(id)}`,
      {
        method: "POST",
        headers: this.getHeaders(token),
      },
    );
    return this.parseOrThrow<UserAccount>(
      res,
      "Failed to suspend user account.",
    );
  }
}

const defaultBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  "http://localhost:8080";

export const api = new ApiClient(defaultBaseUrl);
