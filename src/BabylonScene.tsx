// src/BabylonScene.tsx
import React, { useEffect, useRef } from 'react';
import * as BABYLON from 'babylonjs';

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

        var earthToSatDist = 1.5;
        
        const scene = new BABYLON.Scene(engine);
        scene.useRightHandedSystem = true;
        scene.clearColor = new BABYLON.Color4(0,0,0,1);

        //fetch the json
        const geofenceRes = fetch('jsons/geofence.json');
        const geofenceData = (await geofenceRes).json();

        // Create geofence mesh
        // const geofenceMesh = createGeofenceMesh(geofenceData, scene);

        //light
        var light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(-1, 1, 0), scene);
	      light.diffuse = new BABYLON.Color3(1, 1, 1);
	      light.specular = new BABYLON.Color3(1, 1, 1);
	      light.groundColor = new BABYLON.Color3(0, 0, 0);
            
        //camera
        var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI/2, Math.PI/2, 4, BABYLON.Vector3.Zero(), scene);
        camera.minZ = 0.1;
        // Apply the panning range constraints
        camera.lowerRadiusLimit = 1;
        camera.upperRadiusLimit = 6;
        camera.attachControl();

        // Skybox
        var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:50.0}, scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/SkyboxTextures/skybox", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;
  
        //earth material
        var earthMat = new BABYLON.PBRMaterial("earthMat", scene);
        earthMat.albedoTexture = new BABYLON.Texture("assets/8k_earth_daymap.jpg", scene, undefined, false);
        earthMat.bumpTexture = new BABYLON.Texture("assets/8k_earth_normal_map.jpg", scene, undefined, false);
        earthMat.metallic = 0.0;
        earthMat.roughness = 1.0;    

        //earth
        var earth = BABYLON.MeshBuilder.CreateSphere("earth", {segments: 30, diameter: 1.5}, scene);
        earth.material = earthMat;

        //satellite
        var satellite = BABYLON.MeshBuilder.CreateSphere("satellite", {segments: 5, diameter: 0.08}, scene);
  
        //cone material
        var coneMat = new BABYLON.PBRMaterial('coneMat', scene);
        coneMat.albedoColor = new BABYLON.Color3(1,1,1);
        coneMat.alpha = 0.2;

        //cone
        var cone = BABYLON.MeshBuilder.CreateCylinder("cone", {height: earthToSatDist/2, diameterTop: 0, diameterBottom: 0.14 }, scene);
        cone.position = new BABYLON.Vector3(0, 0,earthToSatDist/4);
        cone.rotation.x = toRadians(270);
        cone.parent = satellite;
        cone.material = coneMat;
        coneMat.unlit = true;

        // // Function to convert latitude and longitude to 3D coordinates
        // function latLonToCoordinates(latitude: number, longitude: number, radius: number): BABYLON.Vector3 {
        //   const phi = toRadians(90 - latitude);
        //   const theta = toRadians(longitude + 180);
          
        //   const x = radius * Math.sin(phi) * Math.cos(theta);
        //   const y = radius * Math.cos(phi);
        //   const z = radius * Math.sin(phi) * Math.sin(theta);
          
        //   return new BABYLON.Vector3(x, y, z);
        // }

        // // Example usage:

        // var satellite = BABYLON.MeshBuilder.CreateSphere("satellite", {segments: 20, diameter: 0.5}, scene);
        // const coordinates = latLonToCoordinates(37.7749, -122.4194, 2); // San Francisco
        // satellite.position = coordinates;

         // Animation
        var angle = 0;
        scene.registerBeforeRender(function () {

          satellite.position = new BABYLON.Vector3(Math.cos(angle) * earthToSatDist, 0, Math.sin(angle) * earthToSatDist);

          // Update spotlight position and direction
          satellite.lookAt(earth.position);

          // Update the angle for the next frame
          angle += 0.005;
        });

        return scene;
      };

      const createGeofenceMesh = (geojson: any, scene: BABYLON.Scene) => {
        // Check if geojson and its features array exist
        if (!geojson || !geojson.features || !Array.isArray(geojson.features) || geojson.features.length === 0) {
          console.error('Invalid GeoJSON data');
          return null; // or handle the error in a way that makes sense for your application
        }
      
        // Get the first feature's geometry
        const geometry = geojson.features[0].geometry;
      
        // Check if the geometry and coordinates array exist
        if (!geometry || !geometry.coordinates || !Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
          console.error('Invalid GeoJSON geometry');
          return null; // or handle the error
        }
      
        const coordinates = geometry.coordinates[0];
      
        // Check if coordinates array is valid
        if (!Array.isArray(coordinates) || coordinates.length < 3) {
          console.error('Invalid GeoJSON coordinates');
          return null; // or handle the error
        }
      
        // Convert GeoJSON coordinates to Babylon.js Vector3 array
        const positions = coordinates.map(coordinate => {
          const lon = coordinate[0];
          const lat = coordinate[1];
          const altitude = 0; // You can adjust this if needed
          return new BABYLON.Vector3(lon, altitude, lat);
        });
      
        // Create polygon from the positions
        const polygon = BABYLON.MeshBuilder.CreatePolygon('geofencePolygon', { shape: positions }, scene);
      
        // Customize the appearance of the geofence mesh if needed
      
        return polygon;
      };
      
      const scene = createScene();

      engine.runRenderLoop(async () => {
        if (scene) {
          (await scene).render();
        }
      });

      window.addEventListener('resize', () => {
        engine.resize();
      });

      return () => {
        engine.dispose();
      };
    }
  }, []);

  return <canvas ref={sceneRef} />;
};

export default BabylonScene;
