import { updateUserProfile } from './api';

// Export existing functions
export * from './api';

// Add profile update function
export const updateProfile = async (profileData) => {
    return await updateUserProfile(profileData);
};
