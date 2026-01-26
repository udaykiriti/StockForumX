import { useState } from 'react';
import { FaEdit, FaTimes } from 'react-icons/fa';
import './EditProfileModal.css';

const EditProfileModal = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        avatar: user.avatar || '',
        bio: user.bio || '',
        status: user.status || ''
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><FaEdit /> Edit Profile</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="edit-profile-form">
                    <div className="form-group">
                        <label>Avatar URL</label>
                        <input
                            type="url"
                            name="avatar"
                            value={formData.avatar}
                            onChange={handleChange}
                            placeholder="https://example.com/avatar.jpg"
                            className="form-input"
                        />
                        {formData.avatar && (
                            <div className="avatar-preview">
                                <img src={formData.avatar} alt="Avatar preview" />
                            </div>
                        )}
                        <small className="form-hint">Enter a URL to your profile picture</small>
                    </div>

                    <div className="form-group">
                        <label>Status</label>
                        <input
                            type="text"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            placeholder="What's on your mind?"
                            maxLength="100"
                            className="form-input"
                        />
                        <small className="form-hint">{formData.status.length}/100 characters</small>
                    </div>

                    <div className="form-group">
                        <label>Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell us about yourself..."
                            maxLength="500"
                            rows="4"
                            className="form-textarea"
                        />
                        <small className="form-hint">{formData.bio.length}/500 characters</small>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
