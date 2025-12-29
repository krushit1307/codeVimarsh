import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import ProfileCompletion from './ProfileCompletion';
import { profileAPI, UserProfile } from '../lib/profileApi';

const ProfileManagement: React.FC = () => {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleClose = () => {
    // window.close only works for windows opened by script (window.open)
    window.close();
    // If still open, fallback to SPA navigation
    setTimeout(() => {
      if (!window.closed) {
        if (window.history.length > 1) navigate(-1);
        else navigate('/');
      }
    }, 50);
  };

  useEffect(() => {
    // Set window title when component mounts
    document.title = 'Profile Management - Code Vimarsh';
    
    // Focus the window when opened
    window.focus();
    
    return () => {
      // Reset title when unmounting
      document.title = 'Code Vimarsh';
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const result = await profileAPI.getProfile();
      if (result.success && result.data) {
        setProfile(result.data.profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    setShowEditModal(false);
    loadProfile(); // Reload profile data
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="pointer-events-none absolute -top-48 -right-40 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-56 -left-40 h-[28rem] w-[28rem] rounded-full bg-orange-400/10 blur-3xl animate-pulse" />
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  <span className="text-gradient-orange">My Profile</span>
                </h1>
                <p className="text-gray-400 text-sm">Manage your personal information and preferences</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center gap-2"
                  title="Close window"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-orange-500/25"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-800/50">
            {profile ? (
              <div className="space-y-6">
                {/* Profile Image and Basic Info */}
                <div className="flex items-start space-x-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 border-2 border-gray-600">
                    {profile.profileImage ? (
                      <img 
                        src={profile.profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-3">
                      {profile.fullName || 'Not set'}
                    </h2>
                    <div className="space-y-2 text-gray-300">
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-orange-400">Email:</span> 
                        <span className="text-gray-300">{user?.email}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-orange-400">PRN Number:</span> 
                        <span className="text-gray-300">{profile.prnNumber || 'Not set'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-orange-400">Class:</span> 
                        <span className="text-gray-300">{profile.class || 'Not set'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-orange-400">Division:</span> 
                        <span className="text-gray-300">{profile.division || 'Not set'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className={`px-4 py-2 rounded-full text-sm font-medium shadow-lg ${
                      profile.isProfileComplete 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {profile.isProfileComplete ? '✓ Complete' : '⚠ Incomplete'}
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                {profile.bio && (
                  <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                    <h3 className="text-lg font-semibold text-white mb-3">About Me</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                )}

                {/* Account Information */}
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <span className="font-medium text-orange-400 block mb-1">Account Created:</span>
                      <p className="text-gray-300">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <span className="font-medium text-orange-400 block mb-1">Last Sign In:</span>
                      <p className="text-gray-300">
                        {user?.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <span className="font-medium text-orange-400 block mb-1">Email Verified:</span>
                      <p className="text-gray-300">
                        {user?.email_confirmed_at ? '✅ Yes' : '❌ No'}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <span className="font-medium text-orange-400 block mb-1">Profile Updated:</span>
                      <p className="text-gray-300">
                        {new Date(profile.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Completion Status */}
                {!profile.isProfileComplete && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-yellow-400">Profile Incomplete</h4>
                        <p className="text-sm text-gray-300 mt-1">
                          Complete your profile to get the most out of Code Vimarsh.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-800/30 rounded-lg">
                <svg className="w-20 h-20 text-gray-500 mx-auto mb-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-3">No Profile Yet</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  You haven't completed your profile yet. Click the button below to get started and unlock all features of Code Vimarsh.
                </p>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-orange-500/25"
                >
                  Complete Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <ProfileCompletion
            onComplete={handleProfileUpdate}
            onCancel={() => setShowEditModal(false)}
            isModal={true}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileManagement;
