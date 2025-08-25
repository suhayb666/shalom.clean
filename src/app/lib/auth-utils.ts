import pool from './db';

export interface User {
  id: number;
  name: string;
  email: string;
  position: string;
  role: string;
  is_active: boolean;
  gender: string;
  date_of_birth: string;
  phone: string;
}

export async function getCurrentUserFromRequest(req: Request): Promise<User | null> {
  try {
    console.log("🔍 Getting current user with proper header forwarding...");
    
    // Get the base URL from the request
    const baseUrl = new URL(req.url).origin;
    const authUrl = `${baseUrl}/api/auth/me`;
    console.log("🌐 Auth URL:", authUrl);
    
    // Forward the exact same headers, especially cookies
    const requestHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      requestHeaders[key] = value;
    });
    
    console.log("🍪 Request headers being forwarded:", Object.keys(requestHeaders));
    
    const response = await fetch(authUrl, {
      method: 'GET',
      headers: requestHeaders,
      cache: 'no-store',
    });
    
    console.log("🔐 Auth API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Auth API failed:", response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    console.log("✅ Auth API success, user:", data.user?.name, "role:", data.user?.role);
    
    return data.user || null;
    
  } catch (error) {
    console.error("🚨 getCurrentUserFromRequest error:", error);
    return null;
  }
}

// Alternative: Direct database auth (if you want to bypass the internal API call)
export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    // This would require implementing JWT verification
    // For now, we'll stick with the API call approach above
    console.log("🔍 Direct token verification not implemented yet");
    return null;
  } catch (error) {
    console.error("🚨 getUserFromToken error:", error);
    return null;
  }
}