async function getSpawnPoint(roomKey, pointName) {
  const room = roomData[roomKey];
  const response = await fetch(room.json);
  const data = await response.json();

  // Find the spawnpoints layer
  const spawnLayer = data.layers.find((layer) => layer.name === "spawnpoints");
  if (!spawnLayer) {
    throw new Error(`Layer "spawnpoints" not found in ${room.json}`);
  }

  // Find the object with the specific name
  const spawnPoint = spawnLayer.objects.find((obj) => obj.name === pointName);
  if (!spawnPoint) {
    throw new Error(
      `Spawn point "${pointName}" not found in layer "spawnpoints"`
    );
  }

  return { x: spawnPoint.x, y: spawnPoint.y };
}
