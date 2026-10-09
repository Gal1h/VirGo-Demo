// VirGO Mobile Client - Reanimated 4 Gesture System
// File: RemoteApp/src/app/controller.tsx & addconfig.tsx (excerpts)

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from "react-native-reanimated";

/**
 * Mouse Drag Gesture - Relative movement tracking
 * Runs on UI thread via Reanimated worklets
 */
export const createMouseDragGesture = (sendEvent: (coord: string) => void) =>
  Gesture.Pan()
    .minDistance(0)                    // Fire immediately on any movement
    .onChange((evt) => {
      "worklet";                       // Execute on UI thread
      if (evt.changeX !== 0 || evt.changeY !== 0) {
        // Send relative coordinates as "dx,dy"
        runOnJS(sendEvent)(`${evt.changeX},${evt.changeY}`);
      }
    })
    // No onEnd - continuous drag events sent during pan

/**
 * Key Press Gesture - Long press for hold, release on end
 * Simultaneous with mouse gesture for combined input
 */
export const createKeyGesture = (
  input: string,
  type: "key" | "mouse",
  sendEvent: (input: string, action: string, type: string) => void
) =>
  Gesture.LongPress()
    .onBegin(() => {
      "worklet";
      runOnJS(sendEvent)(
        input,
        type === "mouse" ? "drag" : "press",
        type
      );
    })
    .onFinalize(() => {
      "worklet";
      runOnJS(sendEvent)(
        input,
        type === "mouse" ? "drag" : "release",
        type
      );
    });

/**
 * Draggable Position Gesture - For editor layout
 * Uses shared values for 60fps smooth dragging
 */
export const createDraggableGesture = (
  initialX: number,
  initialY: number,
  onEnd: (x: number, y: number) => void
) => {
  const savedX = useSharedValue(initialX);
  const savedY = useSharedValue(initialY);
  const tempX = useSharedValue(initialX);
  const tempY = useSharedValue(initialY);

  const gesture = Gesture.Pan()
    .onStart(() => {})
    .onUpdate((e) => {
      tempX.value = savedX.value + e.translationX;
      tempY.value = savedY.value + e.translationY;
    })
    .onEnd((e) => {
      const finalX = tempX.value;
      const finalY = tempY.value;
      savedX.value = finalX;
      savedY.value = finalY;
      runOnJS(onEnd)(finalX, finalY);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tempX.value }, { translateY: tempY.value }],
  }));

  return { gesture, animatedStyle };
};

/**
 * Enable simultaneous gesture recognition
 * Allows multiple gestures to fire concurrently
 */
export const enableSimultaneousGestures = (gestures: ReturnType<typeof Gesture.LongPress>[]) => {
  const mouseGesture = Gesture.Pan().minDistance(0); // Reference for simultaneous

  gestures.forEach((g, i) => {
    g.simultaneousWithExternalGesture(mouseGesture);
    mouseGesture.simultaneousWithExternalGesture(g);
    gestures.filter((_, j) => j !== i).forEach(o => g.simultaneousWithExternalGesture(o));
  });
};

/**
 * AxisPad Joystick Event Handler
 * Converts touch events to normalized coordinates
 */
export const handleJoystickEvent = (
  event: AxisPadTouchEvent,
  sendEvent: (coord: string) => void
) => {
  if (event.eventType === "pan") {
    // event.ratio.x, event.ratio.y are 0.0-1.0 normalized
    sendEvent(`${event.ratio.x},${event.ratio.y}`);
  } else if (event.eventType === "end") {
    // Snap back to center on release
    sendEvent("0.5,0.5");
  }
};

/**
 * TCP Event Sender - Serializes and sends JSON events
 */
export const createEventSender = (socket: TcpSocket) => {
  return (input: string, action: string, type: string) => {
    if (socket) {
      const data = JSON.stringify({
        key: input.toLowerCase(),
        action,
        type
      }) + "\n"; // Newline delimiter for server framing
      socket.write(data).catch(() => { /* handle disconnect */ });
    }
  };
};