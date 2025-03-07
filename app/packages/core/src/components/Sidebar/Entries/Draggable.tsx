import { useTheme } from "@fiftyone/components";
import { DragIndicator } from "@mui/icons-material";
import { animated, useSpring } from "@react-spring/web";
import React, { useState } from "react";

const Draggable: React.FC<
  React.PropsWithChildren<{
    color: string;
    entryKey: string;
    trigger?: (
      event: React.MouseEvent<HTMLDivElement>,
      key: string,
      cb: () => void
    ) => void;
  }>
> = ({ children, color, entryKey, trigger }) => {
  const theme = useTheme();
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);

  const active = trigger && (dragging || hovering);

  const style = useSpring({
    width: active ? 20 : 5,
    left: active ? -10 : 0,
    cursor: entryKey && trigger ? (dragging ? "grabbing" : "grab") : "pointer",
  });

  return (
    <>
      <animated.div
        onMouseDown={
          trigger
            ? (event) => {
                setDragging(true);
                trigger(event, entryKey, () => setDragging(false));
              }
            : null
        }
        onMouseEnter={() => trigger && setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{
          backgroundColor: color,
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: active ? 100 : 0,
          borderRadius: 2,

          height: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: `0 2px 20px ${theme.custom.shadow}`,
          overflow: "hidden",
          ...style,
        }}
        title={trigger ? "Drag to reorder" : null}
      >
        {active && (dragging || hovering) && (
          <DragIndicator style={{ color: theme.background.level1 }} />
        )}
      </animated.div>
      <div style={{ width: "100%" }}>{children}</div>
    </>
  );
};

export default Draggable;
