import { useState } from 'react';
import { updateProfile } from '../../services/api';
import toast from 'react-hot-toast';
import './ProfileEdit.css';

const ProfileEdit = ({ user, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        avatar: user.avatar || '',
        bio: user.bio || '',
        status: user.status || ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
                    <div className="form-group">
                        <label htmlFor="avatar">Avatar URL</label>
                        <input
                            type="url"
                            id="avatar"
                            name="avatar"
                            value={formData.avatar}
                            onChange={handleChange}
                            placeholder="https://example.com/avatar.jpg"
                            className="form-input"
                        />
                        <small className="form-hint">
                            Enter a URL to your profile picture (optional)
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
