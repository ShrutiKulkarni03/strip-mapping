// src/BabylonScene.tsx
import React, { useEffect, useRef } from 'react';
import * as BABYLON from 'babylonjs';

const BabylonScene: React.FC = () => {
  const sceneRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (sceneRef.current) {
      // Babylon.js code
      const engine = new BABYLON.Engine(sceneRef.current, true);

      const createScene = () => {
        const scene = new BABYLON.Scene(engine);
        scene.useRightHandedSystem = true
        scene.clearColor = new BABYLON.Color4(0,0,0,1);

        // Create a light
        var light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(-1, 1, 0), scene);
	    light.diffuse = new BABYLON.Color3(1, 1, 1);

        // Skybox
        var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:50.0}, scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/SkyboxTextures/skybox", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;
  
       //Sphere to see the light's position
       var earthMat = new BABYLON.PBRMaterial("earthMat", scene);
       earthMat.albedoTexture = new BABYLON.Texture("assets/8k_earth_daymap.jpg", scene, undefined, false);
       earthMat.bumpTexture = new BABYLON.Texture("assets/8k_earth_normal_map.jpg", scene, undefined, false);
       earthMat.metallic = 0.0;
       earthMat.roughness = 1.0;    

       var earth = BABYLON.MeshBuilder.CreateSphere("earth", {segments: 20, diameter: 1.5}, scene);
       earth.material = earthMat

        
        var camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, Math.PI / 8, 4, BABYLON.Vector3.Zero(), scene);
        camera.minZ = 0.1
        // Apply the panning range constraints
        camera.lowerRadiusLimit = 1
        camera.upperRadiusLimit = 6
	    camera.attachControl();
          

        return scene;
      };

      const scene = createScene();

      engine.runRenderLoop(() => {
        if (scene) {
          scene.render();
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
