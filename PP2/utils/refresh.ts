export async function refreshAccessToken(): Promise<{ success: boolean; accessToken?: string }> {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return { success: false };
  }

  try {
    const refreshRes = await fetch('/api/refresh', {
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
      }
    });

    if (refreshRes.status !== 200) {
      return { success: false };
    }

    const refreshedTokens = await refreshRes.json();
    localStorage.setItem('accessToken', refreshedTokens.accessToken);
    
    return { 
      success: true, 
      accessToken: refreshedTokens.accessToken 
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return { success: false };
  }
}