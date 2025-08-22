// Authentication service for frontend-backend communication

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://162.43.30.178:3001'}/api`;

export interface LoginData {
  userId?: string; // Made optional to support facilityId login
  facilityId?: string; // Added for client login
  password: string;
}

export interface RegisterData {
  surname?: string;
  mainName?: string;
  companyId?: string;
  role?: string;
  userId?: string; // Made optional for company registration
  facilityId?: string; // Added for client registration
  password: string;
  confirmPassword: string;
  address?: string; // Made optional for client registration
  lineUserId?: string; // Added for LINE notifications
}

export interface ClientRegisterData {
  surname: string;
  mainName: string;
  prefectureCity: string; // 都道府県・市区町村
  addressDetail: string;  // 丁目・番地・建物名など
  facilityId: string;
  password: string;
  confirmPassword: string;
  lineUserId?: string; // Added for LINE notifications
}

export interface User {
  id: number;
  userId: string;
  surname?: string;
  mainName?: string;
  role?: string;
  userType: 'company' | 'client';
  companyId?: string;
  facilityId?: string; // Added for client users
  address?: string; // Made optional for client users
  lineUserId?: string; // Added for LINE notifications
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

class AuthService {
  private token: string | null = null;
  private cachedCompanyRole: string | null = null;
  private lastLoginAttempt: number = 0;
  private readonly LOGIN_COOLDOWN = 2000; // 2 seconds cooldown between login attempts
  private lastRegistrationAttempt: number = 0;
  private readonly REGISTRATION_COOLDOWN = 3000; // 3 seconds cooldown between registration attempts

  // Helper method to handle error responses consistently
  private async handleErrorResponse(response: Response, defaultMessage: string): Promise<never> {
    let errorMessage = defaultMessage;
    
    // Handle rate limiting specifically
    if (response.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
    } else {
      // Try to parse JSON error response, fallback to text if it fails
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || `${defaultMessage} (${response.status})`;
      } catch (parseError) {
        // If JSON parsing fails, try to get text response
        try {
          const textError = await response.text();
          errorMessage = textError || `${defaultMessage} (${response.status})`;
        } catch (textError) {
          // If all else fails, use status text
          errorMessage = response.statusText || `${defaultMessage} (${response.status})`;
        }
      }
    }
    
    throw new Error(errorMessage);
  }

  // Store token in localStorage
  private setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth-token', token);
  }

  // Get token from localStorage
  private getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth-token');
    }
    console.log('🔑 Token retrieved:', this.token ? 'Token exists' : 'No token');
    return this.token;
  }

  // Clear token
  private clearToken() {
    this.token = null;
    this.cachedCompanyRole = null; // Clear cached role when logging out
    localStorage.removeItem('auth-token');
  }

  // Get auth headers
  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Login
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      // Check if we're trying to login too quickly
      const now = Date.now();
      if (now - this.lastLoginAttempt < this.LOGIN_COOLDOWN) {
        const remainingTime = Math.ceil((this.LOGIN_COOLDOWN - (now - this.lastLoginAttempt)) / 1000);
        throw new Error(`Please wait ${remainingTime} seconds before trying to login again.`);
      }
      
      this.lastLoginAttempt = now;
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Login failed');
      }

      const data: AuthResponse = await response.json();
      this.setToken(data.token);
      // If backend provides effectiveRole, cache it
      // @ts-ignore
      if ((data as any).effectiveRole) {
        // @ts-ignore
        this.cachedCompanyRole = (data as any).effectiveRole;
        console.log('💾 Cached effective role from login:', this.cachedCompanyRole);
      } else if (data?.user && (data as any)?.user?.companyRole) {
        const role = (data as any).user.companyRole === 'headquarter' ? 'hq-president' : 'branch-president';
        this.cachedCompanyRole = role;
        console.log('💾 Cached role derived from companyRole at login:', role);
      }
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register company user
  async registerCompany(registerData: RegisterData): Promise<any> {
    try {
      // Check if we're trying to register too quickly
      const now = Date.now();
      if (now - this.lastRegistrationAttempt < this.REGISTRATION_COOLDOWN) {
        const remainingTime = Math.ceil((this.REGISTRATION_COOLDOWN - (now - this.lastRegistrationAttempt)) / 1000);
        throw new Error(`Please wait ${remainingTime} seconds before trying to register again.`);
      }
      
      this.lastRegistrationAttempt = now;
      
      const response = await fetch(`${API_BASE_URL}/auth/register/company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Register client
  async registerClient(registerData: ClientRegisterData): Promise<any> {
    try {
      // Check if we're trying to register too quickly
      const now = Date.now();
      if (now - this.lastRegistrationAttempt < this.REGISTRATION_COOLDOWN) {
        const remainingTime = Math.ceil((this.REGISTRATION_COOLDOWN - (now - this.lastRegistrationAttempt)) / 1000);
        throw new Error(`Please wait ${remainingTime} seconds before trying to register again.`);
      }
      
      this.lastRegistrationAttempt = now;
      
      const response = await fetch(`${API_BASE_URL}/auth/register/client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Register company info
  async registerCompanyInfo(registerData: RegisterData): Promise<any> {
    try {
      // Check if we're trying to register too quickly
      const now = Date.now();
      if (now - this.lastRegistrationAttempt < this.REGISTRATION_COOLDOWN) {
        const remainingTime = Math.ceil((this.REGISTRATION_COOLDOWN - (now - this.lastRegistrationAttempt)) / 1000);
        throw new Error(`Please wait ${remainingTime} seconds before trying to register again.`);
      }
      
      this.lastRegistrationAttempt = now;
      
      const response = await fetch(`${API_BASE_URL}/auth/register/company-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Company registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Company registration error:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        this.clearToken();
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Get user error:', error);
      this.clearToken();
      return null;
    }
  }

  // Logout
  logout() {
    this.clearToken();
    window.location.href = '/';
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Clear cached company role (useful for debugging or role changes)
  clearCachedRole() {
    this.cachedCompanyRole = null;
    console.log('🧹 Cleared cached company role');
  }

  // Force refresh role determination (useful for debugging)
  async forceRefreshRole(): Promise<string | null> {
    this.cachedCompanyRole = null;
    console.log('🔄 Force refreshing role determination');
    return await this.getUserRole();
  }

  // Get user role for routing
  async getUserRole(): Promise<string | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;
    
    console.log('🔍 Determining role for user:', {
      userId: user.userId,
      role: user.role,
      userType: user.userType,
      companyId: user.companyId
    });

    // Determine role based on user type and role
    if (user.userType === 'company') {
      if (user.role === 'president') {
        // Check if this is HQ president or branch president based on company role
        console.log('🔍 Fetching company info for company ID:', user.companyId);
        
        // If we have a cached role, use it to avoid infinite loops
        if (this.cachedCompanyRole) {
          console.log('💾 Using cached company role:', this.cachedCompanyRole);
          return this.cachedCompanyRole;
        }
        
        const headers = this.getAuthHeaders();
        console.log('🔑 Auth headers:', headers);
        try {
          const response = await fetch(`${API_BASE_URL}/auth/company-info/${user.companyId}`, {
            headers,
          });
          
          if (response.ok) {
            const companyData = await response.json();
            console.log('✅ Company info received:', companyData);
            // If company role is 'headquarter', this is HQ president
            // If company role is 'branch', this is branch president
            const determinedRole = companyData.company.role === 'headquarter' ? 'hq-president' : 'branch-president';
            console.log('🎯 Determined role:', determinedRole);
            
            // Cache the role for future use
            this.cachedCompanyRole = determinedRole;
            
            return determinedRole;
          } else {
            console.error('❌ Company info response not ok:', response.status, response.statusText);
            
            // If it's a 404, the company might not exist - this is a data issue
            if (response.status === 404) {
              console.error('🚨 Company not found in database - this is a data issue');
            }
          }
        } catch (error) {
          console.error('Error fetching company info:', error);
          console.error('User data:', user);
          console.error('Company ID:', user.companyId);
          
          // If it's a network error, we might want to retry
          if (error instanceof TypeError && error.message.includes('fetch')) {
            console.warn('🌐 Network error - might be server not running');
          }
        }
        
        // Smart fallback: if we can't determine the role, use a reasonable default
        // For now, assume branch-president to prevent infinite loops
        // This can be improved later with better error handling
        console.warn('⚠️ Using fallback role: branch-president (to prevent infinite loops)');
        this.cachedCompanyRole = 'branch-president';
        return 'branch-president';
      } else if (user.role === 'staff') {
        return 'staff';
      }
    } else if (user.userType === 'client') {
      return 'client';
    }

    return null;
  }

  // Redirect based on role
  async redirectBasedOnRole() {
    // First try to use the cached role from login
    if (this.cachedCompanyRole) {
      console.log('💾 Using cached role for redirect:', this.cachedCompanyRole);
      this.redirectToDashboard(this.cachedCompanyRole);
      return;
    }
    
    // Fallback to determining role from user data
    const role = await this.getUserRole();
    console.log('🎯 Redirecting based on determined role:', role);
    
    if (role) {
      this.redirectToDashboard(role);
    } else {
      console.log('⚠️ Unknown role, redirecting to home');
      window.location.href = '/';
    }
  }

  // Helper function to redirect to appropriate dashboard
  private redirectToDashboard(role: string) {
    switch (role) {
      case 'hq-president':
        console.log('🚀 Redirecting to HQ Dashboard');
        window.location.href = '/hq-dashboard';
        break;
      case 'branch-president':
        console.log('🚀 Redirecting to Branch Dashboard');
        window.location.href = '/branch-dashboard';
        break;
      case 'staff':
        console.log('🚀 Redirecting to Staff Dashboard');
        window.location.href = '/staff-dashboard';
        break;
      case 'client':
        console.log('🚀 Redirecting to Client Dashboard');
        window.location.href = '/client-dashboard';
        break;
      default:
        console.log('⚠️ Unknown role, redirecting to home');
        window.location.href = '/';
    }
  }

  // Update security settings (both user ID and password)
  async updateSecurity(securityData: {
    currentUserId: string;
    currentPassword: string;
    newUserId?: string;
    newPassword?: string;
    confirmPassword?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-security`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(securityData),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Security update failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Security update error:', error);
      throw error;
    }
  }

  // Change password only
  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Password change failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  // Change user ID only
  async changeUserId(userIdData: {
    currentUserId: string;
    currentPassword: string;
    newUserId: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-user-id`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userIdData),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, 'User ID change failed');
      }

      return await response.json();
    } catch (error) {
      console.error('User ID change error:', error);
      throw error;
    }
  }

  // Verify credentials (for security settings)
  async verifyCredentials(credentials: {
    currentUserId: string;
    currentPassword: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-credentials`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, '認証に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('Verify credentials error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
