"use client";
import React from "react";
import { ConnectionControls } from "./ConnectionControls";
import { CameraControls } from "./CameraControls";
import { MessageControls } from "./MessageControls";

export const WebSocketPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <ConnectionControls />
      <CameraControls />
      <MessageControls />
    </div>
  );
};
