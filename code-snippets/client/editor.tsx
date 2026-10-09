// VirGO Mobile Client - Drag-and-Drop Layout Editor
// File: RemoteApp/src/app/addconfig.tsx (excerpt)

import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from "react-native-reanimated";

type Options = { width: number; height: number; borderWidth?: number; borderRadius: number; borderColor: string; opacity?: number };
type ButtonData = { id: string; input: string; name?: string; type: string; x: number; y: number; option: Options };

const AddConfig = () => {
  const [buttons, setButtons] = useState<ButtonData[]>([]);
  const [editTab, setEditTab] = useState(false);
  const [tempId, setTempId] = useState("");
  const [tempOptions, setTempOptions] = useState<Options>({ width: 100, height: 100, borderRadius: 0, borderColor: "white", opacity: 1 });

  // Update button position (drag handler)
  const updatePositions = (id: string, x: number, y: number) => {
    setButtons(prev => prev.map(btn => btn.id === id ? { ...btn, x, y } : btn));
  };

  // Draggable button component with Reanimated 4
  const DraggableButton = ({ id, input, x, y, options }: ButtonData) => {
    const savedX = useSharedValue(x);
    const savedY = useSharedValue(y);
    const tempX = useSharedValue(x);
    const tempY = useSharedValue(y);

    const panGesture = Gesture.Pan()
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
        runOnJS(updatePositions)(id, finalX, finalY);
      });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: tempX.value }, { translateY: tempY.value }],
    }));

    return (
      <Box style={{ position: "absolute" }}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[options, animatedStyle]}>
            <Button style={[
              { borderRadius: options.borderRadius, width: options.width, height: options.height, backgroundColor: "none" }
            ]} onLongPress={() => { setEditTab(true); setTempId(id); }}>
              <ButtonText style={{ color: "white" }}>{input}</ButtonText>
            </Button>
          </Animated.View>
        </GestureDetector>
      </Box>
    );
  };

  // Edit dialog with sliders for visual properties
  const EditDialog = () => (
    <AlertDialog isOpen={editTab} onClose={() => setEditTab(false)}>
      <AlertDialogContent>
        <Grid className="gap-6" _extra={{ className: "grid-cols-10" }}>
          {/* Type & Input Selection */}
          <GridItem _extra={{ className: "col-span-3" }}>
            <Select onValueChange={(e) => { setSelectedType(e); /* set input based on type */ }}>
              <SelectItem label="Key" value="key" />
              <SelectItem label="Mouse" value="mouse" />
              <SelectItem label="Joystick" value="joystick" />
            </Select>
          </GridItem>

          {/* Visual Property Sliders */}
          <GridItem _extra={{ className: "col-span-7" }}>
            <ScrollView>
              {/* Width/Height (linked for joystick) */}
              <SliderRow label="Width" value={tempOptions.width} max={300}
                onChange={v => setTempOptions({...tempOptions, width: v, height: selectedType==="joystick"?v:tempOptions.height })} />
              {selectedType !== "joystick" && (
                <SliderRow label="Height" value={tempOptions.height} max={300}
                  onChange={v => setTempOptions({...tempOptions, height: v})} />
              )}
              <SliderRow label="Radius" value={tempOptions.borderRadius} max={100}
                onChange={v => setTempOptions({...tempOptions, borderRadius: v})} />
              <SliderRow label="Border" value={tempOptions.borderWidth} max={10}
                onChange={v => setTempOptions({...tempOptions, borderWidth: v})} />
              <SliderRow label="Opacity" value={tempOptions.opacity} max={1} step={0.01}
                onChange={v => setTempOptions({...tempOptions, opacity: v})} />
            </ScrollView>
          </GridItem>
        </Grid>

        <AlertDialogFooter>
          <Button onPress={() => { setEditTab(false); deleteButton(tempId); }}>Delete</Button>
          <Button onPress={() => {
            const finalOpts = selectedType === "joystick" ? {...tempOptions, borderRadius: tempOptions.width/2} : tempOptions;
            setEditTab(false);
            updateButtonData(tempId, finalOpts);
            updateInput(tempId, tempInput, selectedType);
          }}>Save</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Save profile to MMKV
  const saveConfig = () => {
    const configId = nanoid();
    storage.set(configId, JSON.stringify({ id: configId, name: tempName, buttons }));
    router.back();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#211D23" }}>
      {/* Render all draggable buttons */}
      {buttons.map(e => <DraggableButton key={e.id} {...e} />)}
      {/* Floating menu: Add, Save, Back */}
      <Button style={styles.addConfig} onPress={() => setDrawerBtn(!drawerBtn)}>
        <Icon as={MenuIcon} />
        {drawerBtn && (
          <VStack>
            <Button onPress={() => setButtons([...buttons, newButton()])}><Icon as={AddIcon} /></Button>
            <Button onPress={() => setShowAlertDialog(true)}><Icon as={CheckIcon} /></Button>
            <Button onPress={() => router.back()}><Icon as={ArrowLeftIcon} /></Button>
          </VStack>
        )}
      </Button>
      {/* Save confirmation dialog */}
      <AlertDialog isOpen={showAlertDialog}>
        <InputField placeholder="Profile name" onChangeText={setTempName} />
        <Button onPress={saveConfig}>Save</Button>
      </AlertDialog>
      {EditDialog()}
    </GestureHandlerRootView>
  );
};