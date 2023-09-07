// @flow

import axios from 'axios'
import env from './env.js'
import chalk from 'chalk'
import readline from 'readline-sync'
import delay from 'delay'
import { diff } from 'deep-object-diff'

type Light = {
  state: LightState,
  name: string,
}

type LightState = {
  on: boolean,
  bri: number, // [0, 254]
  hue: number, // [0, 65535]
  sat: number, // [0, 254]
  effect: string,
  xy: Array<any>,
  ct: number,
  alert: string,
  colormode: string,
  mode: string,
  reachable: boolean
}

const {
  BRIDGE_USERNAME,
  BRIDGE_INTERNAL_IP,
  SCENE_DATA
} = process.env

let username = BRIDGE_USERNAME || ''
let sceneData = JSON.parse(SCENE_DATA || JSON.stringify({}))

function exists(value) {
  return value !== undefined && value !== null
}

// Creates an axios instance and returns functions over it.
function makeBridge(bridgeUrl) {
  const instance = axios.create({
    baseURL: bridgeUrl
  })

  async function checkUser(username) {
    if (!username) return false
    const res = await instance.get(
      `/api/${username}`
    )
    const description = res.data?.[0]?.error?.description
    if (description === 'unauthorized user') {
      return false
    } else {
      return true
    }
  }

  async function createUser() {
    let res = await instance.post(
      '/api',
      {
        "devicetype":"my_hue_app"
      }
    )
    const description = res.data?.[0]?.error?.description
    if (description !== 'link button not pressed') {
      throw new Error('Expected to wait for button press.')
    }

    console.log(chalk.bgYellow.bold('\n  Pause  '))
    readline.keyInPause('Press the button on your bridge. Then unpause the program.');

    res = await axios.post(
      '/api',
      {
        "devicetype":"my_hue_app"
      },
      {
        baseURL: bridgeUrl
      }
    )
    username = res.data?.[0]?.success?.username
    if (!username) {
      throw new Error('Failed to create user.')
    } else {
      env.set({BRIDGE_USERNAME: username})
      console.log(chalk.bgGreen.bold('\n  Created  '))
      console.log('A new user was created and saved into .env.')
    }
  }

  async function listLights(): Promise<{[lightId: string]: Light}> {
    const res = await instance.get(`/api/${username}/lights`)
    return res.data || {}
  }

  async function setLightState(lightId: string, state: $Shape<LightState>) {
    const res = await instance.put(`/api/${username}/lights/${lightId}/state`, state)
  }

  async function saveCurrentScene(sceneId: string) {
    console.log(chalk.bgYellow.bold('\n  Confirm  '))
    readline.keyInPause('Are you sure?');

    try {
      const lights = await listLights()
      sceneData = {
        ...sceneData,
        [sceneId]: lights 
      }
      env.set({SCENE_DATA: JSON.stringify(sceneData)})
      console.log(`Scene ${sceneId} saved.`)
    } catch(err) {
      console.error(err)
    }
  }

  async function loadScene(sceneId: string) {
    try {
      const sceneLights = sceneData[sceneId]
      if (!sceneLights) {
        throw new Error(`Scene ${sceneId} does not exist.`)
      }
      
      async function changeLights() {
        const currentLights = await listLights()
        // let changed = false
        for (const lightId of Object.keys(sceneLights)) {
          if (!currentLights[lightId]) {
            await setLightState(lightId, sceneLights[lightId].state)
          }
    
          // console.log(currentLights[lightId].state)
          // const d = diff(currentLights[lightId].state, sceneLights[lightId].state)
          // console.log('setting')
          // console.log(d)
          // if (d['colormode']) {
            // A colormode change is required
            // await setLightState(lightId, {
            //   colormode: d.colormode
            // })
          // }

          // if (exists(d['bri']) || exists(d['hue'])) {
            // changed = true
          // }
          
          // A differece must be used otherwise the transition will not be smooth.
          // There's a bug in Hue where reading out light state is different than updating.
          // await setLightState(lightId, d)
          await setLightState(lightId, {
            on: sceneLights[lightId].state['on'],
            hue: sceneLights[lightId].state['hue'],
            bri: sceneLights[lightId].state['bri'],
            xy: sceneLights[lightId].state['xy'],
          })
        }
      }

      await changeLights()
      
      console.log(`Loaded scene ${sceneId}.`)
    } catch(err) {
      console.error(err)
    }
  }

  return {
    checkUser,
    createUser,
    listLights,
    setLightState,
    saveCurrentScene,
    loadScene,
  }
}

async function connect() {
  try {
    let bridgeIp = BRIDGE_INTERNAL_IP

    if (!bridgeIp) {
      console.log('BRIDGE_INTERNAL_IP:', BRIDGE_INTERNAL_IP)
      console.log('Automatically establishing BRIDGE_INTERNAL_IP...')
      console.log('GET https://discovery.meethue.com/')
      try {
        const res = await axios.get('https://discovery.meethue.com/')
        bridgeIp = res.data?.[0]?.internalipaddress
        console.log('Bridge IP found.')
        env.set({BRIDGE_INTERNAL_IP: bridgeIp})
      } catch(err) {
        console.error('Error:', err?.response?.status, err?.response?.statusText)
        console.log('Failed to establish bridge IP.')
        env.set({BRIDGE_INTERNAL_IP: '0.0.0.0'})
        console.log(`You can manually set it by editting ${env.envPath}.`)
        throw new Error()
      }
    }
  
    const bridgeUrl = `http://${bridgeIp}`
  
    // Create a connection to bridgeUrl.
    const bridge = makeBridge(bridgeUrl)
  
    // The Hue API requires that a user be made.
  
    // Check if a user exists, or create one.
    const userExists = await bridge.checkUser(username)
    if (!userExists) {
      console.log(chalk.bgRed.bold('\n  Error  '))
      console.log('The user specified by .env does not exist. Creating a new user...')
      await bridge.createUser()
    }
  
    return bridge
  } catch (err) {
    if (err && err.response) {
      console.error('Error:', err?.response?.status, err?.response?.statusText)
    }
    await delay(30000)
  }
}

export default connect