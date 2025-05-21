// src/components/HtmlCard.js
import React from "react";

const HtmlCard = ({ title, src, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid #ddd",
        margin: "1rem",
        padding: "1rem",
        cursor: "pointer",
        width: "320px",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        transition: "all 0.2s ease-in-out",
        transform: "scale(1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
        e.currentTarget.style.transform = "scale(1.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <div style={{ marginBottom: "0.75rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            margin: 0,
            textAlign: "left",
            lineHeight: "1.2",
          }}
        >
          {title}
        </h3>
      </div>

      <div
        style={{
          width: "100%",
          height: "200px",
          overflow: "hidden",
          border: "1px solid #eee",
          borderRadius: "4px",
          background: "white",
        }}
      >
     <iframe
  src={src}
  title={title}
  loading="lazy"
  sandbox=""
  style={{
    transform: "scale(0.5)",
    transformOrigin: "top left",
    width: "200%",
    height: "400px",
    border: "none",
    pointerEvents: "none",
  }}
></iframe>

      </div>
    </div>
  );
};

export default HtmlCard;
