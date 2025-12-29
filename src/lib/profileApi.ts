import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from './supabaseClient';

const API_BASE_URL = 'http://localhost:5000/api';

export interface UserProfile {
  _id: string;
  user: string;
  fullName: string;
  profileImage?: string;
  prnNumber: string;
  class: string;
  division: 'GIA' | 'SFI';
  bio: string;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileFormData {
  fullName: string;
  profileImage?: string;
  prnNumber: string;
  class: string;
  division: 'GIA' | 'SFI';
  bio: string;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

class ProfileAPI {
  private async getAuthHeaders() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getProfile(): Promise<{ success: boolean; data?: { profile: UserProfile | null }; message?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers,
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  async createOrUpdateProfile(profileData: ProfileFormData): Promise<{ 
    success: boolean; 
    data?: { profile: UserProfile }; 
    message?: string; 
    errors?: any 
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data, message: data.message };
      } else {
        return { success: false, message: data.message, errors: data.errors };
      }
    } catch (error) {
      console.error('Create/Update profile error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  async uploadImage(imageData: string): Promise<{ 
    success: boolean; 
    data?: CloudinaryUploadResult; 
    message?: string 
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/profile/upload-image`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: imageData }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Upload image error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  async deleteImage(): Promise<{ 
    success: boolean; 
    data?: { profile: UserProfile }; 
    message?: string 
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/profile/image`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Delete image error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  async validateImageURL(url: string): Promise<boolean> {
    try {
      // Basic URL validation
      const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i;
      const cloudinaryPattern = /^https:\/\/res\.cloudinary\.com\/.+/i;
      
      return urlPattern.test(url) || cloudinaryPattern.test(url);
    } catch (error) {
      return false;
    }
  }
}

export const profileAPI = new ProfileAPI();
