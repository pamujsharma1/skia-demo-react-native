import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Dimensions, ActivityIndicator, ScrollView, PanResponder } from 'react-native';
import { PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import {
    Canvas,
    Image,
    useImage,
    useCanvasRef,
    Group,
    Circle,
    Rect,
    Path,
    Line,
    Points,
    Text as SkiaText,
    useFont,
    ImageFormat,
    vec,
    Skia,
} from '@shopify/react-native-skia';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { TextInput } from 'react-native';

const { width, height } = Dimensions.get('window');

const SHAPE_STYLES = [
    { type: 'text', color: 'rgba(255, 255, 255, 1)' },
    { type: 'circle', color: 'rgba(0, 255, 255, 0.7)' },
    { type: 'rect', color: 'rgba(255, 0, 255, 0.7)' },
    { type: 'star', color: 'rgba(255, 255, 0, 0.8)' },
    { type: 'polygon', color: 'rgba(0, 255, 0, 0.7)' },
    { type: 'line', color: 'rgba(255, 128, 0, 0.9)' },
    { type: 'points', color: 'rgba(255, 255, 255, 0.9)' }
];

const COLORS = [
    'rgba(0, 255, 255, 0.9)', // Cyan
    'rgba(255, 0, 255, 0.9)', // Magenta
    'rgba(255, 255, 0, 0.9)', // Yellow
    'rgba(0, 255, 0, 0.9)',   // Green
    'rgba(255, 128, 0, 0.9)', // Orange
    'rgba(255, 255, 255, 0.9)', // White
    'rgba(255, 0, 0, 0.9)',   // Red
    'rgba(0, 0, 255, 0.9)',   // Blue
    'transparent'             // Transparent
];

export default function ImageEditorScreen({ route }) {
    const { imageUri } = route.params;
    const image = useImage(imageUri);
    const canvasRef = useCanvasRef();
    const navigation = useNavigation();

    // Load a font for Text shapes
    const font = useFont(require('../../assets/Roboto-Regular.ttf'), 32);

    const [isSaving, setIsSaving] = useState(false);
    const [shapes, setShapes] = useState([]); // List of shapes added to the canvas
    const [selectedShapeId, setSelectedShapeId] = useState(null);
    const [isScrollEnabled, setIsScrollEnabled] = useState(true);
    const [colorMode, setColorMode] = useState('fill'); // 'fill' or 'stroke'
    const [isDrawingMode, setIsDrawingMode] = useState(false);

    // Image Zoom & Pan State
    const [imageScale, setImageScale] = useState(1);
    const [baseImageScale, setBaseImageScale] = useState(1);
    const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
    const [baseImageOffset, setBaseImageOffset] = useState({ x: 0, y: 0 });

    const activeShapeRef = useRef(null);

    // Set up single PanGestureHandler for both Shapes and Image
    const onPanEvent = (event) => {
        if (activeShapeRef.current) {
            setShapes((prev) => prev.map(shape => {
                if (shape.id === activeShapeRef.current) {
                    if (shape.type === 'freehand') {
                        return {
                            ...shape,
                            points: [...shape.points, {
                                x: shape.startX + event.nativeEvent.translationX,
                                y: shape.startY + event.nativeEvent.translationY
                            }]
                        };
                    }
                    return {
                        ...shape,
                        x: shape.startX + event.nativeEvent.translationX,
                        y: shape.startY + event.nativeEvent.translationY,
                    };
                }
                return shape;
            }));
        } else {
            setImageOffset({
                x: baseImageOffset.x + event.nativeEvent.translationX,
                y: baseImageOffset.y + event.nativeEvent.translationY,
            });
        }
    };

    const onPanStateChange = (event) => {
        if (event.nativeEvent.state === State.BEGAN) {
            const touchX = event.nativeEvent.x;
            const touchY = event.nativeEvent.y;

            if (isDrawingMode) {
                const newShape = {
                    id: Date.now().toString(),
                    type: 'freehand',
                    points: [{ x: touchX, y: touchY }],
                    startX: touchX,
                    startY: touchY,
                    color: 'transparent',
                    strokeColor: COLORS[0], // default cyan
                    strokeWidth: 4,
                    x: 0,
                    y: 0,
                    size: 0,
                    rotation: 0,
                };
                setShapes(currentShapes => [...currentShapes, newShape]);
                setSelectedShapeId(newShape.id);
                setColorMode('stroke');
                activeShapeRef.current = newShape.id;
                setIsScrollEnabled(false);
                return;
            }

            let touchedShape = null;
            setShapes((currentShapes) => {
                for (let i = currentShapes.length - 1; i >= 0; i--) {
                    const shape = currentShapes[i];
                    if (shape.type === 'freehand') continue; // Don't tap-select freehand shapes by center for now
                    const margin = 20;
                    if (
                        touchX >= shape.x - shape.size / 2 - margin &&
                        touchX <= shape.x + shape.size / 2 + margin &&
                        touchY >= shape.y - shape.size / 2 - margin &&
                        touchY <= shape.y + shape.size / 2 + margin
                    ) {
                        touchedShape = shape;
                        break;
                    }
                }

                if (touchedShape) {
                    setSelectedShapeId(touchedShape.id);
                    activeShapeRef.current = touchedShape.id;
                    setIsScrollEnabled(false);
                    // Save starting coordinates for all shapes (or just the touched one)
                    return currentShapes.map(s => ({ ...s, startX: s.x, startY: s.y }));
                } else {
                    setSelectedShapeId(null);
                    activeShapeRef.current = null;
                    setIsScrollEnabled(false); // Also disable scroll when panning image
                    return currentShapes;
                }
            });
        } else if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
            if (!activeShapeRef.current) {
                setBaseImageOffset({
                    x: baseImageOffset.x + event.nativeEvent.translationX,
                    y: baseImageOffset.y + event.nativeEvent.translationY,
                });
            }
            activeShapeRef.current = null;
            setIsScrollEnabled(true);
        }
    };

    // Pinch Gesture Handler for Image Zoom
    const onPinchEvent = (event) => {
        setImageScale(baseImageScale * event.nativeEvent.scale);
    };

    const onPinchStateChange = (event) => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            // Prevent shrinking smaller than 1x
            const finalScale = Math.max(1, baseImageScale * event.nativeEvent.scale);
            setBaseImageScale(finalScale);
            setImageScale(finalScale);
        }
    };



    const addShape = (shapeStyle) => {
        // Calculate a random position near the center
        const offset = Math.random() * 60 - 30;
        const newShape = {
            id: Date.now().toString(),
            type: shapeStyle.type,
            color: shapeStyle.type === 'text' ? shapeStyle.color : 'transparent',
            x: width / 2 - 40 + offset, // Approximate center horizontal
            y: (height * 0.6) / 2 + offset, // Approximate center vertical
            size: shapeStyle.type === 'text' ? 40 : 80,
            rotation: 0,
            sides: shapeStyle.type === 'polygon' ? 6 : shapeStyle.type === 'star' ? 5 : 0,
            strokeColor: shapeStyle.type === 'text' ? 'transparent' : shapeStyle.color,
            strokeWidth: shapeStyle.type === 'line' ? 8 : shapeStyle.type === 'points' ? 15 : 4,
            textValue: shapeStyle.type === 'text' ? 'Double tap to edit' : undefined,
        };
        setShapes([...shapes, newShape]);
        setSelectedShapeId(newShape.id);
        setColorMode(shapeStyle.type === 'text' ? 'fill' : 'stroke');
    };

    const updateText = (text) => {
        if (!selectedShapeId) return;
        setShapes((prev) => prev.map(s => {
            if (s.id === selectedShapeId) {
                return { ...s, textValue: text };
            }
            return s;
        }));
    };

    const rotateLastShape = () => {
        if (shapes.length === 0) return;
        const targetId = selectedShapeId || shapes[shapes.length - 1].id;

        setShapes((prev) => prev.map(s => {
            if (s.id === targetId) {
                return { ...s, rotation: s.rotation + Math.PI / 4 };
            }
            return s;
        }));
    };

    const changeShapeColor = (color) => {
        if (!selectedShapeId) return;
        setShapes((prev) => prev.map(s => {
            if (s.id === selectedShapeId) {
                if (colorMode === 'stroke') {
                    return { ...s, strokeColor: color };
                }
                return { ...s, color };
            }
            return s;
        }));
    };

    const changeShapeSize = (delta) => {
        if (!selectedShapeId) return;
        setShapes((prev) => prev.map(s => {
            if (s.id === selectedShapeId) {
                // Ensure size doesn't go below a certain minimum (e.g., 20)
                const newSize = Math.max(20, s.size + delta);
                return { ...s, size: newSize };
            }
            return s;
        }));
    };

    const changeShapeSides = (delta) => {
        if (!selectedShapeId) return;
        setShapes((prev) => prev.map(s => {
            if (s.id === selectedShapeId) {
                // Polygon/Star must have at least 3 sides/points, max 20
                const newSides = Math.max(3, Math.min(20, (s.sides || 3) + delta));
                return { ...s, sides: newSides };
            }
            return s;
        }));
    };

    const changeShapeStrokeWidth = (delta) => {
        if (!selectedShapeId) return;
        setShapes((prev) => prev.map(s => {
            if (s.id === selectedShapeId) {
                const currentWidth = s.strokeWidth !== undefined ? s.strokeWidth : 4;
                const newWidth = Math.max(0, currentWidth + delta);
                return { ...s, strokeWidth: newWidth };
            }
            return s;
        }));
    };

    const clearShapes = () => {
        setShapes([]);
        setSelectedShapeId(null);
    };

    const removeLastShape = () => {
        setShapes((prev) => {
            if (prev.length === 0) return prev;

            const newShapes = [...prev];
            const removedShape = newShapes.pop();

            // If the removed shape was selected, clear the selection
            if (selectedShapeId === removedShape.id) {
                setSelectedShapeId(null);
            }

            return newShapes;
        });
    };

    // Function to save the canvas to camera roll
    const saveImage = async () => {
        if (!canvasRef.current || !image) return;
        try {
            setIsSaving(true);
            setSelectedShapeId(null); // Hide selection box before saving

            // Yield to next tick to let selection box disappear
            await new Promise(resolve => setTimeout(resolve, 50));

            // Make sure we have permission to save to the library
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need permission to save the image to your gallery.');
                setIsSaving(false);
                return;
            }

            // Capture canvas snapshot
            const skImage = canvasRef.current.makeImageSnapshot();
            if (skImage) {
                // Encode to base64
                let data = null;
                try {
                    // Skia Image format for encoding (usually 3 for JPEG, 4 for PNG)
                    const format = ImageFormat ? ImageFormat.PNG : 4;
                    data = skImage.encodeToBase64(format, 100);
                } catch (e) {
                    console.log("Failed to encode with format enum, trying fallback...", e);
                    data = skImage.encodeToBase64();
                }

                if (data) {
                    // Temporarily save base64 to file
                    const tempUri = FileSystem.cacheDirectory + `edited-image-${Date.now()}.png`;
                    await FileSystem.writeAsStringAsync(tempUri, data, {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    // Save file to media library
                    await MediaLibrary.saveToLibraryAsync(tempUri);
                    Alert.alert('Success', 'Image saved to your gallery!');
                    navigation.goBack();
                } else {
                    Alert.alert('Error', 'Failed to encode the image.');
                }
            } else {
                Alert.alert('Error', 'Failed to snapshot the canvas.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save the image. Ensure the image is valid.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!image) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#00ffff" />
                <Text style={styles.loadingText}>Loading Image...</Text>
            </View>
        );
    }

    // Calculate rendering size preserving aspect ratio within canvas bounds
    const canvasWidth = width - 40;
    const canvasHeight = height * 0.6;
    const imageAspect = image.width() / image.height();
    const canvasAspect = canvasWidth / canvasHeight;

    let renderWidth = canvasWidth;
    let renderHeight = canvasHeight;

    if (imageAspect > canvasAspect) {
        renderHeight = canvasWidth / imageAspect;
    } else {
        renderWidth = canvasHeight * imageAspect;
    }

    // Apply zoom scaling to the image dimensions
    const scaledWidth = renderWidth * imageScale;
    const scaledHeight = renderHeight * imageScale;

    // Center the scaled image and add pan offset
    const renderX = (canvasWidth - scaledWidth) / 2 + imageOffset.x;
    const renderY = (canvasHeight - scaledHeight) / 2 + imageOffset.y;

    // Helper to generate a star path
    const createStarPath = (cx, cy, radius, points = 5) => {
        const path = Skia.Path.Make();
        const innerRadius = radius * 0.4;
        const angle = Math.PI / points;

        for (let i = 0; i < 2 * points; i++) {
            const r = (i & 1) === 0 ? radius : innerRadius;
            const x = cx + Math.cos(i * angle - Math.PI / 2) * r;
            const y = cy + Math.sin(i * angle - Math.PI / 2) * r;
            if (i === 0) path.moveTo(x, y);
            else path.lineTo(x, y);
        }
        path.close();
        return path;
    };

    // Helper to generate a hexagon/polygon path
    const createPolygonPath = (cx, cy, radius, sides = 6) => {
        const path = Skia.Path.Make();
        const angle = (Math.PI * 2) / sides;

        for (let i = 0; i < sides; i++) {
            const x = cx + radius * Math.cos(i * angle);
            const y = cy + radius * Math.sin(i * angle);
            if (i === 0) path.moveTo(x, y);
            else path.lineTo(x, y);
        }
        path.close();
        return path;
    };

    // Helper to generate points
    const createPoints = (cx, cy, radius) => {
        const pointsArray = [];
        const count = 8;
        const angle = (Math.PI * 2) / count;
        for (let i = 0; i < count; i++) {
            pointsArray.push(vec(cx + radius * Math.cos(i * angle), cy + radius * Math.sin(i * angle)));
        }
        return pointsArray;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} scrollEnabled={isScrollEnabled}>
            <Text style={styles.title}>Edit Visuals</Text>

            <View style={styles.canvasContainer}>
                <Canvas style={{ width: canvasWidth, height: canvasHeight }} ref={canvasRef}>
                    <Group>
                        {/* Background Image is affected by imageScale */}
                        <Image
                            image={image}
                            x={renderX}
                            y={renderY}
                            width={scaledWidth}
                            height={scaledHeight}
                            fit="contain"
                        />
                    </Group>

                    {/* Render Overlays on top of the image (outside filter group) */}
                    <Group>
                        {shapes.map((shape) => {
                            const origin = vec(shape.x, shape.y);
                            const transform = [{ rotate: shape.rotation }];

                            return (
                                <Group key={shape.id} origin={origin} transform={transform}>
                                    {/* Outline if selected */}
                                    {selectedShapeId === shape.id && shape.type !== 'freehand' && (
                                        <Rect x={shape.x - shape.size / 2 - 5} y={shape.y - shape.size / 2 - 5} width={shape.type === 'text' && font ? font.getTextWidth(shape.textValue || '') + 10 : shape.size + 10} height={shape.size + 10} color="#00ffff" style="stroke" strokeWidth={2} />
                                    )}
                                    {shape.type === 'text' && font && (
                                        <SkiaText font={font} text={shape.textValue || ''} x={shape.x - (font.getTextWidth(shape.textValue || '') / 2)} y={shape.y + (shape.size / 3)} color={shape.color} />
                                    )}
                                    {shape.type === 'circle' && (
                                        <Group>
                                            <Circle cx={shape.x} cy={shape.y} r={shape.size / 2} color={shape.color} />
                                            {shape.strokeColor !== 'transparent' && <Circle cx={shape.x} cy={shape.y} r={shape.size / 2} color={shape.strokeColor} style="stroke" strokeWidth={shape.strokeWidth} />}
                                        </Group>
                                    )}
                                    {shape.type === 'rect' && (
                                        <Group>
                                            <Rect x={shape.x - shape.size / 2} y={shape.y - shape.size / 2} width={shape.size} height={shape.size} color={shape.color} />
                                            {shape.strokeColor !== 'transparent' && <Rect x={shape.x - shape.size / 2} y={shape.y - shape.size / 2} width={shape.size} height={shape.size} color={shape.strokeColor} style="stroke" strokeWidth={shape.strokeWidth} />}
                                        </Group>
                                    )}
                                    {shape.type === 'star' && (
                                        <Group>
                                            <Path path={createStarPath(shape.x, shape.y, shape.size / 2, shape.sides)} color={shape.color} />
                                            {shape.strokeColor !== 'transparent' && <Path path={createStarPath(shape.x, shape.y, shape.size / 2, shape.sides)} color={shape.strokeColor} style="stroke" strokeWidth={shape.strokeWidth} />}
                                        </Group>
                                    )}
                                    {shape.type === 'polygon' && (
                                        <Group>
                                            <Path path={createPolygonPath(shape.x, shape.y, shape.size / 2, shape.sides)} color={shape.color} />
                                            {shape.strokeColor !== 'transparent' && <Path path={createPolygonPath(shape.x, shape.y, shape.size / 2, shape.sides)} color={shape.strokeColor} style="stroke" strokeWidth={shape.strokeWidth} />}
                                        </Group>
                                    )}
                                    {shape.type === 'line' && <Line p1={vec(shape.x - shape.size / 2, shape.y - shape.size / 2)} p2={vec(shape.x + shape.size / 2, shape.y + shape.size / 2)} color={shape.strokeColor !== 'transparent' ? shape.strokeColor : shape.color} strokeWidth={shape.strokeWidth} />}
                                    {shape.type === 'points' && <Points points={createPoints(shape.x, shape.y, shape.size / 1.5)} mode="points" color={shape.strokeColor !== 'transparent' ? shape.strokeColor : shape.color} strokeWidth={shape.strokeWidth} strokeCap="round" />}
                                    {shape.type === 'freehand' && shape.points && shape.points.length > 0 && (
                                        <Path
                                            path={shape.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                                            color={shape.strokeColor !== 'transparent' ? shape.strokeColor : '#00ffff'}
                                            style="stroke"
                                            strokeWidth={shape.strokeWidth || 4}
                                            strokeCap="round"
                                            strokeJoin="round"
                                        />
                                    )}
                                </Group>
                            );
                        })}
                    </Group>
                </Canvas>

                {/* Overlay view to catch pan and pinch gestures */}
                <PanGestureHandler
                    onGestureEvent={onPanEvent}
                    onHandlerStateChange={onPanStateChange}
                    minDist={5}
                >
                    <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]}>
                        <PinchGestureHandler
                            onGestureEvent={onPinchEvent}
                            onHandlerStateChange={onPinchStateChange}
                        >
                            <View style={StyleSheet.absoluteFill} />
                        </PinchGestureHandler>
                    </View>
                </PanGestureHandler>
            </View>

            <View style={styles.controlsContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={[styles.subtitle, { marginBottom: 0 }]}>Tools & Shapes (Tap to stamp)</Text>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            {
                                flex: 0,
                                paddingHorizontal: 15,
                                paddingVertical: 5,
                                backgroundColor: isDrawingMode ? 'rgba(0, 255, 255, 0.2)' : '#222',
                                borderColor: isDrawingMode ? '#00ffff' : '#333'
                            }
                        ]}
                        onPress={() => setIsDrawingMode(!isDrawingMode)}
                    >
                        <Text style={[styles.filterText, { color: isDrawingMode ? '#00ffff' : '#fff' }]}>
                            {isDrawingMode ? 'Drawing: ON' : 'Draw (Pen)'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10, paddingHorizontal: 5 }}
                    style={{ marginBottom: 20 }}
                >
                    {SHAPE_STYLES.map((style) => (
                        <TouchableOpacity
                            key={style.type}
                            style={[
                                styles.filterButton,
                                {
                                    flex: 0,
                                    paddingHorizontal: 25,
                                    borderColor: style.color.replace(/0\.\d+\)/, '1)')
                                }
                            ]}
                            onPress={() => addShape(style)}
                        >
                            <Text style={styles.filterText}>{style.type.toUpperCase()}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Shape Properties UI */}
                {shapes.length > 0 && selectedShapeId && (() => {
                    const selectedShape = shapes.find(s => s.id === selectedShapeId);
                    const showSidesControl = selectedShape && (selectedShape.type === 'polygon' || selectedShape.type === 'star');

                    return (
                        <View style={styles.propertiesContainer}>
                            <Text style={styles.subtitle}>Modify Shape</Text>

                            <View style={styles.sizeRow}>
                                <Text style={styles.propertyLabel}>Size</Text>
                                <TouchableOpacity style={styles.sizeButton} onPress={() => changeShapeSize(-10)}>
                                    <Text style={styles.sizeButtonText}>-</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.sizeButton} onPress={() => changeShapeSize(10)}>
                                    <Text style={styles.sizeButtonText}>+</Text>
                                </TouchableOpacity>

                                {showSidesControl && (
                                    <>
                                        <Text style={[styles.propertyLabel, { marginLeft: 15 }]}>Sides</Text>
                                        <TouchableOpacity style={styles.sizeButton} onPress={() => changeShapeSides(-1)}>
                                            <Text style={styles.sizeButtonText}>-</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.sizeButton} onPress={() => changeShapeSides(1)}>
                                            <Text style={styles.sizeButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>

                            {selectedShape && selectedShape.type === 'text' && (
                                <View style={[styles.sizeRow, { marginTop: 15 }]}>
                                    <TextInput
                                        style={styles.textInput}
                                        value={selectedShape.textValue}
                                        onChangeText={updateText}
                                        placeholder="Enter text..."
                                        placeholderTextColor="#888"
                                    />
                                </View>
                            )}

                            <View style={[styles.sizeRow, { marginTop: 15 }]}>
                                <TouchableOpacity
                                    style={[styles.modeButton, colorMode === 'fill' && styles.modeButtonActive]}
                                    onPress={() => setColorMode('fill')}
                                >
                                    <Text style={styles.modeButtonText}>Fill Color</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modeButton, colorMode === 'stroke' && styles.modeButtonActive]}
                                    onPress={() => setColorMode('stroke')}
                                >
                                    <Text style={styles.modeButtonText}>Border Color</Text>
                                </TouchableOpacity>
                            </View>

                            {colorMode === 'stroke' && (
                                <View style={[styles.sizeRow, { marginTop: 15 }]}>
                                    <Text style={styles.propertyLabel}>Border Width</Text>
                                    <TouchableOpacity style={styles.sizeButton} onPress={() => changeShapeStrokeWidth(-1)}>
                                        <Text style={styles.sizeButtonText}>-</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.sizeButton} onPress={() => changeShapeStrokeWidth(1)}>
                                        <Text style={styles.sizeButtonText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <Text style={[styles.propertyLabel, { marginTop: 15 }]}>
                                {colorMode === 'fill' ? 'Select Fill Color' : 'Select Border Color'}
                            </Text>
                            <View style={styles.colorRow}>
                                {COLORS.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.colorSwatch, { backgroundColor: c }]}
                                        onPress={() => changeShapeColor(c)}
                                    />
                                ))}
                            </View>
                        </View>
                    );
                })()}

                <View style={[styles.filterRow, { marginTop: 15 }]}>
                    <TouchableOpacity
                        style={[styles.saveButton, { flex: 1, backgroundColor: '#ff4444', marginTop: 0, marginRight: 5 }]}
                        onPress={clearShapes}
                        disabled={shapes.length === 0}
                    >
                        <Text style={[styles.saveButtonText, { color: '#fff' }]}>Clear All</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.saveButton, { flex: 1, backgroundColor: '#ff9900', marginTop: 0, marginHorizontal: 5 }]}
                        onPress={removeLastShape}
                        disabled={shapes.length === 0}
                    >
                        <Text style={[styles.saveButtonText, { color: '#000', fontSize: 14 }]}>Remove Last</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.saveButton, { flex: 1, backgroundColor: '#00ffff', marginTop: 0, marginLeft: 5 }]}
                        onPress={rotateLastShape}
                        disabled={shapes.length === 0}
                    >
                        <Text style={[styles.saveButtonText, { color: '#000', fontSize: 14 }]}>Rotate Target</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveImage}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Image</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 60,
        paddingBottom: 40,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#00ffff',
        marginTop: 20,
        fontSize: 16,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        letterSpacing: 2,
    },
    canvasContainer: {
        marginHorizontal: 20,
        backgroundColor: '#111',
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    controlsContainer: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: 30,
    },
    subtitle: {
        color: '#aaa',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 30,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#222',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    filterText: {
        color: '#fff',
        fontSize: 14,
    },
    saveButton: {
        backgroundColor: '#bb86fc',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#bb86fc',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
        marginTop: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    propertiesContainer: {
        marginBottom: 20,
        backgroundColor: '#1a1a1a',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    propertyLabel: {
        color: '#aaa',
        fontSize: 12,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sizeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    sizeButton: {
        backgroundColor: '#333',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#00ffff'
    },
    sizeButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 28,
    },
    colorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    colorSwatch: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#555',
    },
    modeButton: {
        flex: 1,
        paddingVertical: 8,
        backgroundColor: '#222',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
    },
    modeButtonActive: {
        borderColor: '#00ffff',
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
    },
    modeButtonText: {
        color: '#fff',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#222',
        color: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444',
        fontSize: 16,
    }
});
