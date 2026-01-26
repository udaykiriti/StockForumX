import { Link } from 'react-router-dom';
import { FaInbox } from 'react-icons/fa';
import './EmptyState.css';

const EmptyState = ({
    title = 'No Data Found',
    message = 'We couldn\'t find what you were looking for.',
    icon = <FaInbox />,
    actionLabel,
    actionLink,
    onAction
}) => {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">
                {icon}
            </div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-message">{message}</p>

            {(actionLabel && (actionLink || onAction)) && (
                <div className="empty-state-action">
                    {actionLink ? (
                        <Link to={actionLink} className="btn btn-primary">
                            {actionLabel}
                        </Link>
                    ) : (
                        <button onClick={onAction} className="btn btn-primary">
                            {actionLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
