// @flow

import connect from './util/connect.js'

Promise.resolve().then(async () => {
  const bridge = await connect()

  const lights = await bridge.listLights()

  for (const lightId of Object.keys(lights)) {
    const light = lights[lightId]

    /*
      For reference:
      light.state: {
        on: true,
        bri: 254,
        hue: 41490,
        sat: 78,
        effect: 'none',
        xy: [ 0.3116, 0.3277 ],
        ct: 153,
        alert: 'select',
        colormode: 'ct',
        mode: 'homeautomation',
        reachable: true
      }
    */
   
    await bridge.setLightState(lightId, {on: false})
  }
})