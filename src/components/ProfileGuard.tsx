import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import ProfileCompletion from './ProfileCompletion';
import { profileAPI } from '../lib/profileApi';

interface ProfileGuardProps {
  children: React.ReactNode;
  requireComplete?: boolean;
}

const ProfileGuard: React.FC<ProfileGuardProps> = ({ 
  children, 
  requireComplete = true 
}) => {
  const { user, isLoading: authLoading } = useSupabaseAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      checkProfileStatus();
    } else {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const checkProfileStatus = async () => {
    try {
      const result = await profileAPI.getProfile();
      if (result.success && result.data) {
        const p = result.data.profile;
        const isComplete = Boolean(p?.isProfileComplete);
        setProfileComplete(isComplete);
        
        // Show profile modal if profile is incomplete and completion is required
        if (requireComplete && !isComplete) {
          setShowProfileModal(true);
        }
      }
    } catch (error) {
      console.error('Error checking profile status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileComplete = () => {
    setShowProfileModal(false);
    setProfileComplete(true);
  };

  const handleSkipProfile = () => {
    setShowProfileModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If not authenticated, let the normal auth flow handle it
  if (!user || authLoading) {
    return <>{children}</>;
  }

  // If profile completion is required but not complete, show modal
  if (requireComplete && !profileComplete && showProfileModal) {
    return (
      <>
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <ProfileCompletion 
          onComplete={handleProfileComplete}
          onCancel={handleSkipProfile}
          isModal={true}
        />
      </>
    );
  }

  // If profile is complete or not required, show children
  return <>{children}</>;
};

export default ProfileGuard;
