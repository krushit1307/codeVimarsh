import React, { useEffect, useRef, useState } from "react";
import { profileAPI, type ProfileFormData, type UserProfile } from "../lib/profileApi";
import { useSupabaseAuth } from "../contexts/SupabaseAuthContext";

interface ProfileCompletionProps {
  onComplete?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({
  onComplete,
  onCancel,
  isModal = true,
}) => {
  const { user } = useSupabaseAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: "",
    prnNumber: "",
    class: "",
    division: "GIA",
    bio: "",
    profileImage: "",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCancel = () => {
    onCancel?.();
  };

  useEffect(() => {
    if (!user) return;
    void loadProfile();
  }, [user]);

  useEffect(() => {
    if (!isModal) return;
    if (!onCancel) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModal, onCancel]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const result = await profileAPI.getProfile();
      const p = result.success ? result.data?.profile : null;
      if (p) {
        setProfile(p);
        setFormData({
          fullName: p.fullName || "",
          prnNumber: p.prnNumber || "",
          class: p.class || "",
          division: p.division || "GIA",
          bio: p.bio || "",
          profileImage: p.profileImage || "",
        });
        setPreviewImage(p.profileImage || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.prnNumber.trim()) newErrors.prnNumber = "PRN number is required";
    else if (!/^[A-Za-z0-9]{6,20}$/.test(formData.prnNumber)) {
      newErrors.prnNumber = "PRN number must be 6-20 alphanumeric characters";
    }
    if (!formData.class.trim()) newErrors.class = "Class is required";
    if (!formData.division) newErrors.division = "Division is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await profileAPI.createOrUpdateProfile(formData);
      if (result.success) {
        onComplete?.();
      } else {
        setErrors(result.errors || {});
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImage = async (imageData: string) => {
    setIsUploading(true);
    try {
      const result = await profileAPI.uploadImage(imageData);
      if (result.success && result.data) {
        setFormData((prev) => ({ ...prev, profileImage: result.data!.url }));
        setErrors((prev) => ({ ...prev, profileImage: "" }));
      } else {
        setErrors((prev) => ({ ...prev, profileImage: result.message || "Upload failed" }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, profileImage: "Upload failed. Please try again." }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, profileImage: "Image size should be less than 5MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewImage(result);
      void uploadImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlSubmit = async () => {
    const url = imageUrl.trim();
    if (!url) {
      setErrors((prev) => ({ ...prev, profileImage: "Please enter an image URL" }));
      return;
    }
    const isValid = await profileAPI.validateImageURL(url);
    if (!isValid) {
      setErrors((prev) => ({ ...prev, profileImage: "Please enter a valid image URL" }));
      return;
    }
    setPreviewImage(url);
    setFormData((prev) => ({ ...prev, profileImage: url }));
    setErrors((prev) => ({ ...prev, profileImage: "" }));
  };

  const handleRemoveImage = async () => {
    try {
      await profileAPI.deleteImage();
      setPreviewImage("");
      setFormData((prev) => ({ ...prev, profileImage: "" }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error removing image:", error);
    }
  };

  const content = (
    <div
      className="relative bg-gray-900/90 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700 overflow-hidden"
    >
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-orange-400/10 blur-3xl" />

      <div className="relative p-6 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              <span className="text-gradient-orange">Complete Your Profile</span>
            </h2>
            <p className="text-gray-400 mt-2">
              {profile?.isProfileComplete
                ? "Update your personal information below"
                : "Please provide your details to complete your profile"}
            </p>
          </div>

          {isModal && onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="shrink-0 px-3 py-2 text-sm border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-all duration-200"
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-orange-400 mb-2">Profile Image</label>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 border-2 border-gray-600">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex space-x-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      activeTab === "upload" ? "bg-orange-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("url")}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      activeTab === "url" ? "bg-orange-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    URL
                  </button>
                  {previewImage && (
                    <button
                      type="button"
                      onClick={() => void handleRemoveImage()}
                      className="px-3 py-1 text-sm rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {activeTab === "upload" ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="profile-upload"
                    />
                    <label
                      htmlFor="profile-upload"
                      className="cursor-pointer inline-block px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                    >
                      {isUploading ? "Uploading..." : "Choose File"}
                    </label>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => void handleImageUrlSubmit()}
                      className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                    >
                      Set
                    </button>
                  </div>
                )}
              </div>
            </div>
            {errors.profileImage && <p className="text-red-400 text-sm">{errors.profileImage}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-orange-400 mb-1">Full Name *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-400 ${
                  errors.fullName ? "border-red-500" : "border-gray-600"
                }`}
                placeholder="Enter your full name"
              />
              {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="prnNumber" className="block text-sm font-medium text-orange-400 mb-1">PRN Number *</label>
              <input
                type="text"
                id="prnNumber"
                name="prnNumber"
                value={formData.prnNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-400 ${
                  errors.prnNumber ? "border-red-500" : "border-gray-600"
                }`}
                placeholder="Enter your PRN number"
              />
              {errors.prnNumber && <p className="text-red-400 text-sm mt-1">{errors.prnNumber}</p>}
            </div>

            <div>
              <label htmlFor="class" className="block text-sm font-medium text-orange-400 mb-1">Class *</label>
              <input
                type="text"
                id="class"
                name="class"
                value={formData.class}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-400 ${
                  errors.class ? "border-red-500" : "border-gray-600"
                }`}
                placeholder="Enter your class"
              />
              {errors.class && <p className="text-red-400 text-sm mt-1">{errors.class}</p>}
            </div>

            <div>
              <label htmlFor="division" className="block text-sm font-medium text-orange-400 mb-1">Division *</label>
              <select
                id="division"
                name="division"
                value={formData.division}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-white ${
                  errors.division ? "border-red-500" : "border-gray-600"
                }`}
              >
                <option value="GIA" className="bg-gray-800">GIA</option>
                <option value="SFI" className="bg-gray-800">SFI</option>
              </select>
              {errors.division && <p className="text-red-400 text-sm mt-1">{errors.division}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-orange-400 mb-1">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-400"
              placeholder="Tell us about yourself (max 500 characters)"
              maxLength={500}
            />
            <p className="text-gray-400 text-sm mt-1">{formData.bio.length}/500 characters</p>
          </div>

          <div className="flex justify-end space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-700 text-gray-300 rounded-md hover:bg-gray-800 transition-all duration-200"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-md hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-orange-500/25 disabled:opacity-50 hover:shadow-orange-500/35"
            >
              {isLoading ? "Saving..." : profile?.isProfileComplete ? "Update Profile" : "Complete Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && onCancel) handleCancel();
        }}
      >
        <div className="max-h-[90vh] overflow-y-auto w-full flex justify-center">
          <div className="w-full max-w-2xl animate-in fade-in-0 zoom-in-95 duration-200">{content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">{content}</div>
    </div>
  );
};

export default ProfileCompletion;
