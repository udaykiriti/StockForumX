import { useState, useRef } from 'react';
import { updateProfile } from '../../services/api';
import toast from 'react-hot-toast';
import { FaCamera, FaTrash } from 'react-icons/fa';
import './ProfileEdit.css';

const ProfileEdit = ({ user, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        avatar: user.avatar || '',
        bio: user.bio || '',
        status: user.status || ''
    });
    const [loading, setLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(user.avatar || '');
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result;
            setAvatarPreview(base64);
            setFormData(prev => ({
                ...prev,
                avatar: base64
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveAvatar = () => {
        setAvatarPreview('');
        setFormData(prev => ({
            ...prev,
            avatar: ''
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.bio.length > 500) {
            toast.error('Bio must be less than 500 characters');
            return;
        }

        if (formData.status.length > 100) {
            toast.error('Status must be less than 100 characters');
            return;
        }

        setLoading(true);
        try {
            const { data } = await updateProfile(formData);
            toast.success('Profile updated successfully!');
            onSuccess(data);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content profile-edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Profile</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="profile-edit-form">
                    <div className="form-group avatar-upload-group">
                        <label>Profile Photo</label>
                        <div className="avatar-upload-wrapper">
                            <div className="avatar-preview-container">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar preview"
                                        className="avatar-preview-img"
                                    />
                                ) : (
                                    <div className="avatar-placeholder-large">
                                        {user.username?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                )}
                                <label className="avatar-upload-overlay" title="Upload new photo">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <FaCamera className="camera-icon" />
                                </label>
                            </div>
                            <div className="avatar-actions">
                                <button
                                    type="button"
                                    className="btn-upload-photo"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <FaCamera /> Upload Photo
                                </button>
                                {avatarPreview && (
                                    <button
                                        type="button"
                                        className="btn-remove-photo"
                                        onClick={handleRemoveAvatar}
                                    >
                                        <FaTrash /> Remove
                                    </button>
                                )}
                            </div>
                        </div>
                        <small className="form-hint">
                            Accepted formats: JPG, PNG, GIF (max 5MB)
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="status">Status</label>
                        <input
                            type="text"
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            placeholder="What's on your mind?"
                            maxLength={100}
                            className="form-input"
                        />
                        <small className="form-hint">
                            {formData.status.length}/100 characters
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio">Bio</label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell us about yourself..."
                            maxLength={500}
                            rows={6}
                            className="form-textarea"
                        />
                        <small className="form-hint">
                            {formData.bio.length}/500 characters
                        </small>
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileEdit;
