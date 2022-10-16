/**
 * basic server health
 */

import {
  ImageRequest,
} from './api.d';


// when we are on dev we want to specifiy 9000 as the port for the backend
// when we are on prod we want be realtive to the current url
export const API_URL = import.meta.env.DEV ? "http://localhost:9000" : "";

export const HEALTH_PING_INTERVAL = 5000; // 5 seconds
export const healthPing = async () => {
  const pingUrl = `${API_URL}/ping`;
  const response = await fetch(pingUrl);
  const data = await response.json();
  return data;
};

/**
 * the local list of modifications
 */
export const loadModifications = async () => {
  const response = await fetch(`${API_URL}/modifiers.json`);
  const data = await response.json();
  return data;
};

export const getSaveDirectory = async () => {
  const response = await fetch(`${API_URL}/output_dir`);
  const data = await response.json();
  return data[0];
};

export const KEY_CONFIG = "config";
export const getConfig = async () => {
  const response = await fetch(`${API_URL}/app_config`);
  const data = await response.json();
  return data;
};

export const KEY_TOGGLE_CONFIG = "toggle_config";
export const toggleBetaConfig = async (branch: string) => {
  const response = await fetch(`${API_URL}/app_config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      update_branch: branch,
    }),
  });
  const data = await response.json();
  return data;
};


export const MakeImageKey = "MakeImage";
export const doMakeImage = async (reqBody: ImageRequest) => {
  const res = await fetch(`${API_URL}/image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reqBody),
  });
  return res;
};

export const doStopImage = async () => {

  const response = await fetch(`${API_URL}/image/stop`);
  const data = await response.json();
  return data;
};