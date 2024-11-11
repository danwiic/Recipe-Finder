// Components/Popup.js
import './Style/Popup.css'; 

export default function Popup({ trigger, setTrigger, children }) {
    return (
        <div className={`popup ${trigger ? 'active' : ''}`}>
            <div className="popup-inner">
                {children}
            </div>
        </div>
    );
};
