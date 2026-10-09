// VirGO Mobile Client - Controller Screen
// File: RemoteApp/src/app/controller.tsx (excerpt)

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import TcpSocket from "react-native-tcp-socket";
import { AxisPad, AxisPadTouchEvent } from "@fustaro/react-native-axis-pad";

type ButtonData = {
  id: string;
  input: string;
  name?: string;
  type: "key" | "mouse" | "joystick";
  x: number;
  y: number;
  option: Options;
};

const Controller = () => {
  const [buttons, setButtons] = useState<ButtonData[]>([]);
  const clientRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isHostConnected, setHostConnected] = useState(true);

  // TCP Connection with auto-reconnect
  const connectSocket = useCallback(() => {
    if (clientRef.current) {
      try { clientRef.current.destroy(); } catch {}
    }
    const client = TcpSocket.createConnection(
      { port: 8000, host: "127.0.0.1" },
      () => { setIsConnected(true); setHostConnected(true); }
    );
    client.on("error", () => { setIsConnected(false); });
    clientRef.current = client;
  }, []);

  useEffect(() => {
    Orientation.lockToLandscape();
    const config = currentConfig.getString("config");
    if (config) { setButtons(JSON.parse(config).buttons); }
    connectSocket();
    return () => { if (clientRef.current) { clientRef.current.destroy(); } };
  }, [connectSocket]);

  // Send event over TCP (JSON + newline)
  const sendKeyEvent = useCallback(async (input: string, action: string, type: string) => {
    if (clientRef.current) {
      const data = JSON.stringify({ key: input.toLowerCase(), action, type }) + "\n";
      try { await clientRef.current.write(data); }
      catch { setHostConnected(false); }
    }
  }, []);

  // Mouse drag gesture (relative movement)
  const mouseGesture = useMemo(() => Gesture.Pan()
    .minDistance(0)
    .onChange((evt) => {
      "worklet";
      if (evt.changeX !== 0 || evt.changeY !== 0) {
        const coordinate = `${evt.changeX},${evt.changeY}`;
        runOnJS(sendKeyEvent)(coordinate, "drag", "mouse");
      }
    }), [sendKeyEvent]);

  // Joystick handling via AxisPad
  const onTouchEvent = (event: AxisPadTouchEvent) => {
    if (event.eventType === "pan") {
      runOnJS(sendKeyEvent)(`${event.ratio.x},${event.ratio.y}`, "joystick", "joystick");
    } else if (event.eventType === "end") {
      runOnJS(sendKeyEvent)("0.5,0.5", "joystick", "joystick"); // Return to center
    }
  };

  // Key press gestures (long press = hold)
  const keyGestures = useMemo(() => {
    return buttons.map((e) =>
      Gesture.LongPress()
        .onBegin(() => {
          "worklet";
          runOnJS(sendKeyEvent)(
            e.input,
            e.type === "mouse" ? "drag" : "press",
            e.type
          );
        })
        .onFinalize(() => {
          "worklet";
          runOnJS(sendKeyEvent)(
            e.input,
            e.type === "mouse" ? "drag" : "release",
            e.type
          );
        })
    );
  }, [buttons, sendKeyEvent]);

  // Enable simultaneous gestures
  keyGestures.forEach((g, i) => {
    g.simultaneousWithExternalGesture(mouseGesture);
    mouseGesture.simultaneousWithExternalGesture(g);
    keyGestures.filter((_, j) => j !== i).forEach(o => g.simultaneousWithExternalGesture(o));
  });

  // Render buttons positioned absolutely
  return (
    <View style={{ flex: 1, position: "absolute", width: "100%", height: "100%" }}>
      {buttons?.map((e, index) => (
        <Box key={e.id} style={{
          position: "absolute",
          transform: [{ translateX: e.x }, { translateY: e.y }],
          width: e.option.width,
          height: e.option.height,
          opacity: e.option.opacity,
        }}>
          {e.input === "mouse" ? (
            // Mouse drag area
            <GestureDetector gesture={mouseGesture}>
              <Pressable style={{ borderWidth: 1, borderColor: "red", height: "100%" }}>
                <Text>Hover me</Text>
              </Pressable>
            </GestureDetector>
          ) : e.input === "joystick" ? (
            // Virtual joystick
            <AxisPad
              id={e.id}
              size={e.option.width}
              padBackgroundStyle={{ backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 2, borderColor: "#06b6d4" }}
              stickStyle={{ backgroundColor: "#06b6d4", width: 50, height: 50, borderRadius: 25 }}
              initialTouchType="no-snap"
              onTouchEvent={onTouchEvent}
            />
          ) : (
            // Keyboard key (long press)
            <GestureDetector gesture={keyGestures[index]}>
              <View style={{
                width: "100%", height: "100%",
                justifyContent: "center", alignItems: "center",
                borderWidth: e.option.borderWidth,
                borderRadius: e.option.borderRadius,
                borderColor: e.option.borderColor || "white",
              }}>
                <Text>{e.input}</Text>
              </View>
            </GestureDetector>
          )}
        </Box>
      ))}
    </View>
  );
};