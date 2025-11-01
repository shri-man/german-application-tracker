// /src/alerts.js
export function alertUser(message, type = "info") {
  const alertBox = document.createElement("div");
  Object.assign(alertBox.style, {
    position: "fixed",
    left: "50%",
    bottom: "20px",
    transform: "translateX(-50%)",
    padding: "12px 20px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: "2000",
    fontSize: "14px",
    opacity: "0",
    color: "white",
    transition: "opacity 0.3s ease-in-out, bottom 0.3s ease-in-out",
    backgroundColor: type === "success" ? "#4CAF50" : type === "error" ? "#F44336" : "#2196F3",
  });
  alertBox.textContent = message;
  document.body.appendChild(alertBox);
  setTimeout(() => {
    alertBox.style.opacity = "1";
    alertBox.style.bottom = "30px";
  }, 10);
  setTimeout(() => {
    alertBox.style.opacity = "0";
    setTimeout(() => alertBox.remove(), 300);
  }, 3500);
}
