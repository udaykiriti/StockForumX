import { useState } from 'react';
import { FaEdit, FaCheck, FaTimes, FaCamera, FaPlus } from 'react-icons/fa';
import './InlineEdit.css';

// Inline edit for single-line text (status)
export const InlineEditStatus = ({ value, onSave, maxLength = 100 }) => {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(value || '');

    const handleSave = async () => {
        await onSave(text);
        setEditing(false);
    };

    const handleCancel = () => {
        setText(value || '');
        setEditing(false);
    };

    if (!editing) {
        return (
            <div className="inline-edit-display">
                {value ? (
                    <div className="editable-text-container" onClick={() => setEditing(true)} title="Click to edit status">
                        <p className="user-status">{value}</p>
                        <FaEdit className="edit-icon-hover" />
                    </div>
                ) : (
                    <button className="add-content-btn" onClick={() => setEditing(true)}>
                        <FaPlus /> Add Status
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="inline-edit-active expand-animation status-edit-container">
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={maxLength}
                placeholder="What's on your mind?"
                className="inline-edit-input"
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                }}
            />
            <div className="inline-edit-actions">
                <button className="inline-save-btn" onClick={handleSave}>Save</button>
                <button className="inline-cancel-btn" onClick={handleCancel}>Cancel</button>
            </div>
            <small className="char-count">{text.length}/{maxLength}</small>
        </div>
    );
};

// Inline edit for multi-line text (bio)
export const InlineEditBio = ({ value, onSave, maxLength = 500 }) => {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(value || '');

    const handleSave = async () => {
        await onSave(text);
        setEditing(false);
    };

    const handleCancel = () => {
        setText(value || '');
        setEditing(false);
    };

    if (!editing) {
        return (
            <div className="inline-edit-display">
                {value ? (
                    <div className="editable-text-container" onClick={() => setEditing(true)} title="Click to edit bio">
                        <p className="user-bio">{value}</p>
                        <FaEdit className="edit-icon-hover" />
                    </div>
                ) : (
                    <button className="add-content-btn" onClick={() => setEditing(true)}>
                        <FaPlus /> Add Bio
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="inline-edit-active expand-animation">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={maxLength}
                placeholder="Tell us about yourself..."
                className="inline-edit-textarea"
                rows="4"
                autoFocus
            />
            <div className="inline-edit-actions">
                <button className="inline-save-btn" onClick={handleSave}>Save</button>
                <button className="inline-cancel-btn" onClick={handleCancel}>Cancel</button>
            </div>
            <small className="char-count">{text.length}/{maxLength}</small>
        </div>
    );
};

// Avatar upload component
export const AvatarUpload = ({ currentAvatar, username, onSave }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Convert to base64 and save
        setUploading(true);
        try {
            const base64 = await fileToBase64(file);
            await onSave(base64);
            setPreview(null);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    return (
        <div className="avatar-upload-container">
            <div className="avatar-display">
                {preview || currentAvatar ? (
                    <img
                        src={preview || currentAvatar}
                        alt={username}
                        className="profile-avatar-img"
                    />
                ) : (
                    <div className="profile-avatar-placeholder">
                        {username?.charAt(0).toUpperCase() || '?'}
                    </div>
                )}

                <label className="avatar-upload-overlay" title="Change profile picture">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                        style={{ display: 'none' }}
                    />
                    <FaCamera className="camera-icon" />
                </label>
            </div>
        </div>
    );
};

export default { InlineEditStatus, InlineEditBio, AvatarUpload };
