// Import the required modules from three.js
import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBM } from "three-noise";

const cloudsFileLow = "./low.json";
const cloudsFileMedium = "./medium.json";
const cloudsFileHigh = "./high.json";

let cloudObjects = [];

const boundingBox = {
  level: "low",
  unit: "octas",
  date: new Date().toISOString().split(".")[0] + "Z",
  north: 46.993408,
  west: 8.397377,
  south: 46.527633,
  east: 8.957877,
  resolutionLat: 0.005,
  resolutionLon: 0.005,
};

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("Canvas3D"),
  antialias: true,
});

// Set the renderer size and background color
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xe0e0e0);

// Add the renderer to the document
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.minDistance = 70;
controls.maxDistance = 700;
controls.maxPolarAngle = Math.PI / 2;

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let bbox;
let modelHeight;
let modelWidth;
// Load the .obj model
const loader = new OBJLoader();
loader.load(
  "./uri.obj",
  function (obj) {
    scene.add(obj);
    obj.position.set(0, 0, 0);

    // Calculate the bounding box of the model
    bbox = new THREE.Box3().setFromObject(obj);
    modelWidth = bbox.max.x - bbox.min.x;
    modelHeight = bbox.max.z - bbox.min.z;

    // Load clouds data from JSON file
    fetch(cloudsFileLow)
      .then((response) => response.json())
      .then((data) => {
        const cloudMatrix = data; // Save the parsed data
        createClouds(modelWidth, modelHeight, bbox.max.y + 10, cloudMatrix);
        //  createMap(modelWidth, modelHeight, bbox.max.y + 10);
      })
      .catch((error) => {
        console.error("Error loading clouds data:", error);
      });

    fetch(cloudsFileMedium)
      .then((response) => response.json())
      .then((data) => {
        const cloudMatrix = data; // Save the parsed data
        createClouds(modelWidth, modelHeight, bbox.max.y + 10, cloudMatrix, 70);
        //  createMap(modelWidth, modelHeight, bbox.max.y + 10);
      })
      .catch((error) => {
        console.error("Error loading clouds data:", error);
      });

    fetch(cloudsFileHigh)
      .then((response) => response.json())
      .then((data) => {
        const cloudMatrix = data; // Save the parsed data
        createClouds(modelWidth, modelHeight, bbox.max.y + 10, cloudMatrix, 90);
        //  createMap(modelWidth, modelHeight, bbox.max.y + 10);
      })
      .catch((error) => {
        console.error("Error loading clouds data:", error);
      });
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// Add a light source
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// Set the camera position
camera.position.z = 500; // Adjust based on your model's scale

// Modify saveCloudMatrix to handle local file data
function saveCloudMatrix(data) {
  const cloudMatrix = [];

  if (data && data.data && Array.isArray(data.data)) {
    // Adjust this part based on your JSON structure
    // Assuming your JSON structure is similar to what you were receiving from the server
    const latMin = boundingBox.south;
    const latMax = boundingBox.north;
    const lonMin = boundingBox.west;
    const lonMax = boundingBox.east;
    const latResolution = boundingBox.resolutionLat;
    const lonResolution = boundingBox.resolutionLon;

    const numRows = Math.ceil((latMax - latMin) / latResolution);
    const numCols = Math.ceil((lonMax - lonMin) / lonResolution);

    // Initialize the matrix with null values
    for (let row = 0; row < numRows; row++) {
      cloudMatrix[row] = Array(numCols).fill(null);
    }

    data.data.forEach((item) => {
      if (item.coordinates && Array.isArray(item.coordinates)) {
        item.coordinates.forEach((coord) => {
          const { lat, lon, dates } = coord;
          if (dates && Array.isArray(dates) && dates.length > 0) {
            const cloudCover = dates[0].value; // Assuming you need the first date's value

            // Calculate matrix indices
            const row = Math.round((lat - latMin) / latResolution);
            const col = Math.round((lon - lonMin) / lonResolution);

            // Store cloud cover in the matrix
            cloudMatrix[row][col] = cloudCover;
          }
        });
      }
    });
  }
  return cloudMatrix;
}

function createClouds(
  modelWidth,
  modelHeight,
  cloudHeight,
  cloudMatrix,
  verticalOffset = 50
) {
  const numRows = cloudMatrix.length;
  const numCols = cloudMatrix[0].length;

  const cellWidth = modelWidth / numCols;
  const cellHeight = modelHeight / numRows;

  const cloudGeometry = new THREE.BufferGeometry();
  const cloudMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 5,
    transparent: true,
    opacity: 0.6,
  });

  const particles = [];
  const fbm = new FBM({
    seed: 42,
    scale: 0.1,
    persistance: 0.5,
    lacunarity: 2,
    octaves: 6,
    redistribution: 1,
  });

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const cloudCover = cloudMatrix[row][col];
      if (cloudCover !== null && cloudCover > 0) {
        const intensity = cloudCover / 8;
        const heightOffset = intensity * cloudHeight;

        const inputVector = new THREE.Vector3(col * 0.1, row * 0.1, 0);

        const noiseValue = fbm.get(inputVector);

        const baseX = THREE.MathUtils.mapLinear(
          col,
          0,
          numCols - 1,
          -modelWidth / 2 + cellWidth / 2,
          modelWidth / 2 - cellWidth / 2
        );
        const baseZ = THREE.MathUtils.mapLinear(
          row,
          0,
          numRows - 1,
          -modelHeight / 2 + cellHeight / 2,
          modelHeight / 2 - cellHeight / 2
        );

        if (intensity > 0) {
          const x = baseX;
          const y = verticalOffset + cloudCover;
          const z = baseZ + heightOffset * noiseValue;

          particles.push(x, y, z);
        }
      }
    }
  }

  if (particles.length > 0) {
    cloudGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(particles, 3)
    );
    const cloudPoints = new THREE.Points(cloudGeometry, cloudMaterial);
    scene.add(cloudPoints);
    cloudObjects.push(cloudPoints); // Track the cloud object
  }
}

function createMap(modelWidth, modelHeight, cloudHeight) {
  const numRows = cloudMatrix.length;
  const numCols = cloudMatrix[0].length;

  const cellWidth = modelWidth / numCols;
  const cellHeight = modelHeight / numRows;

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const cloudCover = cloudMatrix[row][col];

      if (cloudCover !== null) {
        const intensity = cloudCover / 8; // Normalize cloud cover to range [0, 1]
        const colorValue = 1 - intensity; // Invert for greyscale (0 is light, 1 is dark)

        const geometry = new THREE.PlaneGeometry(cellWidth, cellHeight);
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(colorValue, colorValue, colorValue),
          side: THREE.DoubleSide,
          opacity: 0.5,
          transparent: true,
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2; // Make the plane horizontal
        plane.position.set(
          THREE.MathUtils.mapLinear(
            col,
            0,
            numCols - 1,
            -modelWidth / 2 + cellWidth / 2,
            modelWidth / 2 - cellWidth / 2
          ),
          cloudHeight, // Fixed height above the model
          THREE.MathUtils.mapLinear(
            row,
            0,
            numRows - 1,
            -modelHeight / 2 + cellHeight / 2,
            modelHeight / 2 - cellHeight / 2
          )
        );
        scene.add(plane);
      }
    }
  }
}

// Create the animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update controls
  controls.update();

  renderer.render(scene, camera);
}

// Function to fetch data from the backend server and store it in the cloudData object
async function fetchCloudData(level, date) {
  try {
    boundingBox.level = level;
    boundingBox.date = date;

    console.log("Fetching data for level:", level);
    const response = await fetch("http://localhost:3000/fetch-cloud-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ boundingBox }), // Correctly stringify the body
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json(); // Parse the JSON response

    return saveCloudMatrix(data); // Save the parsed data
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function getWeatherData() {
  let date = document.getElementById("date").value;

  const startDate = "2024-08-06";
  const endDate = "2026-08-07";

  if (!date || date.length === 0 || date < startDate || date > endDate) {
    alert(
      "Please enter a valid date: The valid time period for this account type starts at 2024-08-06T00:00:00Z and ends at 2026-08-07T00:00:00Z. "
    );
    return;
  }

  date += ":00Z";

  // Remove existing clouds
  cloudObjects.forEach((cloud) => {
    scene.remove(cloud);
    cloud.geometry.dispose();
    cloud.material.dispose();
  });

  cloudObjects = []; // Clear the array

  let cloudMatrix;

  cloudMatrix = await fetchCloudData("low", date);
  createClouds(modelWidth, modelHeight, bbox.max.y + 10, cloudMatrix, 50);

  cloudMatrix = await fetchCloudData("medium", date);
  createClouds(modelWidth, modelHeight, bbox.max.y + 30, cloudMatrix, 70);

  cloudMatrix = await fetchCloudData("high", date);
  createClouds(modelWidth, modelHeight, bbox.max.y + 50, cloudMatrix, 90);
}

// Start the animation loop
animate();

export { getWeatherData };
