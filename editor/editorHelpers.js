export function moveObject(objects, id, x, y) {
    return objects.map((item) =>
        item.id === id
            ? {
                ...item,
                x,
                y,
            }
            : item
    );
}

export function updateObject(objects, id, data) {
    return objects.map((item) =>
        item.id === id
            ? {
                ...item,
                ...data,
            }
            : item
    );
}

export function addObject(objects, object) {
    return [...objects, object];
}

export function deleteObject(objects, id) {
    return objects.filter((item) => item.id !== id);
}

export function clampPosition(
    x,
    y,
    objectWidth,
    objectHeight,
    canvasWidth,
    canvasHeight,
) {
    const minX = 0;
    const minY = 0;
    const maxX = Math.max(0, canvasWidth - objectWidth);
    const maxY = Math.max(0, canvasHeight - objectHeight);

    return {
        x: Math.max(minX, Math.min(x, maxX)),
        y: Math.max(minY, Math.min(y, maxY)),
    };
}