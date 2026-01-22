import React from "react";
import { ErrorIcon } from "react-hot-toast";

interface ErrorProps {
  message: string;
}

export const ErrorField: React.FC<ErrorProps> = ({ message }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        backgroundColor: "#FEE2E2",
        border: "1px solid #FECACA",
        borderRadius: "8px",
        color: "#DC2626",
        opacity: "80%",
      }}
    >
      <ErrorIcon />
      <span>{message}</span>
    </div>
  );
};

export default ErrorField;
