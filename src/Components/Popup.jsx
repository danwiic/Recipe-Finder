// Components/Popup.js
import './Style/Popup.css'; 

export default function Popup({ trigger, setTrigger, children }) {
    return (
        <div className={`popup ${trigger ? 'active' : ''}`}>
            <div className="popup-inner">
                <button className="close-btn" onClick={() => setTrigger(false)}>&#x2715;</button>
                {children}
            </div>
        </div>
    );
};
