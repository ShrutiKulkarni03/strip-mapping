// src/BabylonScene.tsx
import React, { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";
import "babylonjs-loaders";
import earcut from "earcut";

const BabylonScene: React.FC = () => {
  const sceneRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (sceneRef.current) {
      // Babylon.js code
      const engine = new BABYLON.Engine(sceneRef.current, true);

      const createScene = async () => {
        // Function to convert degrees to radians
        function toRadians(degrees: number): number {
          return degrees * (Math.PI / 180);
        }

        const metadataRes = await fetch("jsons/geofence.json");
        const geofenceData = await metadataRes.json();

        var earthToSatDist = 2;

        const scene = new BABYLON.Scene(engine);
        scene.useRightHandedSystem = true;
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        //light
        var light = new BABYLON.HemisphericLight(
          "hemiLight",
          new BABYLON.Vector3(-1, 1, 0),
          scene
        );
        light.diffuse = new BABYLON.Color3(1, 1, 1);
        light.specular = new BABYLON.Color3(1, 1, 1);
        light.groundColor = new BABYLON.Color3(0, 0, 0);

        //camera
        var camera = new BABYLON.ArcRotateCamera(
          "Camera",
          Math.PI / 2,
          Math.PI / 2,
          4,
          BABYLON.Vector3.Zero(),
          scene
        );
        camera.minZ = 0.1;
        // Apply the panning range constraints
        camera.lowerRadiusLimit = 1.5;
        camera.upperRadiusLimit = 7;
        camera.attachControl();

        // Skybox
        var skybox = BABYLON.MeshBuilder.CreateBox(
          "skyBox",
          { size: 50.0 },
          scene
        );
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(
          "assets/SkyboxTextures/skybox",
          scene
        );
        skyboxMaterial.reflectionTexture.coordinatesMode =
          BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        //earth material
        var earthMat = new BABYLON.PBRMaterial("earthMat", scene);
        earthMat.albedoTexture = new BABYLON.Texture(
          "assets/8k_earth_daymap.jpg",
          scene,
          undefined,
          false
        );
        earthMat.bumpTexture = new BABYLON.Texture(
          "assets/8k_earth_normal_map.jpg",
          scene,
          undefined,
          false
        );
        earthMat.metallic = 0.0;
        earthMat.roughness = 1.0;
        earthMat.alpha = 0.5;

        //earth
        var earth = BABYLON.MeshBuilder.CreateSphere(
          "earth",
          { segments: 30, diameter: 2 },
          scene
        );
        earth.material = earthMat;

        //satellite
        var satellite = BABYLON.MeshBuilder.CreateSphere(
          "satellite",
          { segments: 5, diameter: 0.08 },
          scene
        );

        //cone material
        var coneMat = new BABYLON.PBRMaterial("coneMat", scene);
        coneMat.albedoColor = new BABYLON.Color3(1, 1, 1);
        coneMat.alpha = 0.2;

        //cone
        var cone = BABYLON.MeshBuilder.CreateCylinder(
          "cone",
          { height: earthToSatDist / 2, diameterTop: 0, diameterBottom: 0.14 },
          scene
        );
        cone.position = new BABYLON.Vector3(0, 0, earthToSatDist / 4);
        cone.rotation.x = toRadians(270);
        cone.parent = satellite;
        cone.material = coneMat;
        coneMat.unlit = true;

        // Add latitude lines
        for (let lat = -90; lat <= 90; lat += 1) {
          const myPoints = [];
          for (let lon = -180; lon <= 180; lon += 1) {
            const vector = latLonToVector(lat, lon);
            myPoints.push(new BABYLON.Vector3(vector.x, vector.y, vector.z));
          }
          const lines = BABYLON.MeshBuilder.CreateLines(
            "latLine",
            { points: myPoints },
            scene
          );
          lines.alpha = 0.05;
        }

        // Add longitude lines
        for (let lon = -180; lon <= 180; lon += 1) {
          const myPoints = [];
          for (let lat = -90; lat <= 90; lat += 1) {
            const vector = latLonToVector(lat, lon);
            myPoints.push(new BABYLON.Vector3(vector.x, vector.y, vector.z));
          }
          // Connect the last point to the first to create a closed path
          myPoints.push(myPoints[0]);
          const lines = BABYLON.MeshBuilder.CreateLines(
            "lonLine",
            { points: myPoints },
            scene
          );
          lines.alpha = 0.05;
        }

        // Extract coordinates from GeoJSON
        const coordinates =
          geofenceData.features[0].geometry.coordinates[0].map(
            (coord: any[]) => {
              return [coord[0], coord[1]];
            }
          );

        // Create Babylon.js polygon using PolygonMeshBuilder
        const polygonPoints = coordinates.map((coord: number[]) => {
          const vector = latLonToVector(coord[1], coord[0]);
          return new BABYLON.Vector3(vector.x, vector.y, vector.z);
        });

        // // Assuming you have defined latLonToVector function with appropriate types

        // // Define the displacement values
        // const displacementX: number = -0.1; // Example: move 10 units in the x-direction
        // const displacementY: number = 0.2; // Example: move 5 units in the y-direction
        // const displacementZ: number = -1.3; // Example: move 0 units in the z-direction

        // // // Define the rotation angles in radians
        // const rotationX: number = toRadians(0) // Example: rotate 45 degrees around the x-axis
        // const rotationY: number = toRadians(0) // Example: rotate 30 degrees around the y-axis
        // const rotationZ: number = toRadians(0) // Example: rotate 22.5 degrees around the z-axis

        // // Create a transform node for the polygon
        // const transformNode: BABYLON.TransformNode = new BABYLON.TransformNode(
        //   "polygonTransform",
        //   scene
        // );

        // // Move each vertex in the polygon by the specified displacements
        // const displacedPolygonPoints: BABYLON.Vector3[] = polygonPoints.map(
        //   (coord: BABYLON.Vector3) => {
        //     const displacedX: number = coord.x + displacementX;
        //     const displacedY: number = coord.y + displacementY;
        //     const displacedZ: number = coord.z + displacementZ;

        //     return new BABYLON.Vector3(displacedX, displacedY, displacedZ);
        //   }
        // );


        // // Reverse the order of vertices in the polygonPoints array
        // const reversedPolygonPoints = polygonPoints.reverse();

        // // Create Babylon.js polygon using PolygonMeshBuilder with reversed order
        // // const polygonMeshBuilder = new BABYLON.PolygonMeshBuilder('customPolygon', reversedPolygonPoints, scene, earcut);
        
        // Create Babylon.js polygon using PolygonMeshBuilder with the displaced vertices
        const polygonMeshBuilder: BABYLON.PolygonMeshBuilder =
          new BABYLON.PolygonMeshBuilder(
            "customPolygon",
            polygonPoints,
            scene,
            earcut
          );
        const polygon: BABYLON.Mesh = polygonMeshBuilder.build(false);


        // const polygon = polygonMeshBuilder.build();
        const polygonMaterial = new BABYLON.StandardMaterial(
          "polygonMaterial",
          scene
        );
        polygonMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0); // Red color for the polygon
        polygonMaterial.alpha = 1; // Set transparency
        polygonMaterial.backFaceCulling = false;
        polygon.material = polygonMaterial;

        
        polygon.parent = earth;
        // polygon.rotation.x = toRadians(90);

        // Animation
        var angle = 0;
        scene.registerBeforeRender(function () {
          satellite.position = new BABYLON.Vector3(
            Math.cos(angle) * earthToSatDist,
            0,
            Math.sin(angle) * earthToSatDist
          );

          // Update spotlight position and direction
          satellite.lookAt(earth.position);

          // Update the angle for the next frame
          angle += 0.005;
        });

        return scene;
      };

      const scene = createScene();

      engine.runRenderLoop(async () => {
        if (scene) {
          (await scene).render();
        }
      });

      window.addEventListener("resize", () => {
        engine.resize();
      });

      return () => {
        engine.dispose();
      };
    }
  }, []);

  return <canvas ref={sceneRef} />;
};

function latLonToVector(lat: number, lon: number): BABYLON.Vector3 {
  const radius = 1;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new BABYLON.Vector3(x, y, z);
}

export default BabylonScene;
