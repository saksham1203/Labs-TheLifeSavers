import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const ReviewIcon: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const navigate = useNavigate();
  const buttonWidth = 40;
  const buttonHeight = 100;
  const hiddenOffset = 10; // Slight offset to hide partially on the edge

  const updatePositionWithinBounds = useCallback(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    setPosition((prevPosition) => ({
      x: Math.min(
        prevPosition.x,
        window.innerWidth -
          buttonWidth -
          (scrollbarWidth > 0 ? scrollbarWidth : 0)
      ),
      y: Math.min(prevPosition.y, window.innerHeight - buttonHeight),
    }));
  }, [buttonWidth, buttonHeight]);

  useEffect(() => {
    const updateInitialPosition = () => {
      const initialX = -hiddenOffset; // Align on the left side
      const initialY = window.innerHeight / 2 - buttonHeight / 2; // Center vertically
    
      setPosition({
        x: Math.max(initialX, -hiddenOffset), // Ensure it stays slightly hidden on the left
        y: Math.min(initialY, window.innerHeight - buttonHeight),
      });
    };

    updateInitialPosition();

    const handleResize = () => {
      updatePositionWithinBounds();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updatePositionWithinBounds]);

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    setIsDragging(true);
    setHasMoved(false);

    const clientX =
      e.type === "mousedown"
        ? (e as React.MouseEvent).clientX
        : (e as React.TouchEvent).touches[0].clientX;
    const clientY =
      e.type === "mousedown"
        ? (e as React.MouseEvent).clientY
        : (e as React.TouchEvent).touches[0].clientY;

    setOffset({
      x: clientX - position.x,
      y: clientY - position.y,
    });

    document.body.style.userSelect = "none";
    document.body.style.overflow = "hidden";
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!isDragging) return;

    const clientX =
      e.type === "mousemove"
        ? (e as React.MouseEvent).clientX
        : (e as React.TouchEvent).touches[0].clientX;
    const clientY =
      e.type === "mousemove"
        ? (e as React.MouseEvent).clientY
        : (e as React.TouchEvent).touches[0].clientY;

    let newX = clientX - offset.x;
    let newY = clientY - offset.y;

    if (newX < -hiddenOffset) newX = -hiddenOffset;
    if (newX > window.innerWidth - buttonWidth + hiddenOffset)
      newX = window.innerWidth - buttonWidth + hiddenOffset;

    if (newY < 0) newY = 0;
    if (newY > window.innerHeight - buttonHeight)
      newY = window.innerHeight - buttonHeight;

    requestAnimationFrame(() => {
      setPosition({ x: newX, y: newY });
      setHasMoved(true);
    });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);
    document.body.style.userSelect = "";
    document.body.style.overflow = "";

    if (hasMoved) {
      if (position.x < window.innerWidth / 2) {
        setPosition((prevPosition) => ({
          x: -hiddenOffset,
          y: prevPosition.y,
        })); // Snap to left side
      } else {
        const scrollbarWidth =
          window.innerWidth - document.documentElement.clientWidth;
        setPosition((prevPosition) => ({
          x:
            window.innerWidth -
            buttonWidth +
            hiddenOffset -
            (scrollbarWidth > 0 ? scrollbarWidth : 0),
          y: prevPosition.y,
        })); // Snap to right side
      }
    }
  };

  const handleClick = () => {
    if (!hasMoved) {
      navigate("/reviews");
    }
  };

  const isOnLeft = position.x < window.innerWidth / 2;

  return (
    <div
      className="fixed bg-red-500 text-white text-center flex items-center justify-center cursor-pointer shadow-lg rounded-lg hover:bg-red-600 transform hover:scale-105 transition-transform duration-300 ease-in-out"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
        width: `${buttonWidth}px`,
        height: `${buttonHeight}px`,
        userSelect: "none",
        // zIndex: 1000,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      role="button"
      aria-label="Navigate to reviews page"
    >
      <span
        className={`font-bold transform ${
          isOnLeft ? "rotate-90" : "-rotate-90"
        }`}
      >
        Reviews
      </span>
    </div>
  );
};

export default ReviewIcon;
