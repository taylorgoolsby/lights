// @flow

import connect from './util/connect.js'

Promise.resolve().then(async () => {
  const bridge = await connect()

  const lights = await bridge.listLights()
  console.log('lights', lights)

  const lightId = Object.keys(lights)[0]
  if (!lightId) {
    throw new Error('Unable to find any light')
  }

  await bridge.setLightState(lightId, {on: true})

  const nColors = 4
  // const nColors = 12
  const cycleTime = 15000
  const timeStep = 200
  const stepRatio = timeStep / cycleTime

  const hueFullStep = 65535 / nColors
  const hueTimeStep = hueFullStep * stepRatio
  const briFullStep = cycleTime / 2
  const briTimeStep = briFullStep * stepRatio

  const maxColor = 47500
  const minColor = 44000
  const offset1 = minColor
  const offset2 = maxColor

  let lerp = 0
  // let hue = 0
  let hue1 = offset1
  let hue2 = offset2
  let reverse1 = 1
  let reverse2 = 1
  setInterval(async () => {
    lerp += briTimeStep * (2 * Math.PI) / briFullStep / 2
    const min = 0
    const max = 256
    const bri3 = Math.round(Math.cos(lerp) * Math.cos(lerp) * (max - min)) + min
    const bri4 = Math.round(Math.sin(lerp) * Math.sin(lerp) * (max - min)) + min
    await bridge.setLightState('3', {bri: bri3})
    await bridge.setLightState('4', {bri: bri4})

    hue1 = Math.floor(hue1 + hueTimeStep * reverse1)
    hue2 = Math.floor(hue2 + hueTimeStep * reverse2)

    if (hue1 >= 65535) {
      hue1 = 0
    }

    if (hue2 >= 65535) {
      hue2 = 0
    }

    console.log('hue1', hue1, hue2)

    // if (hue1 < minColor) {
    //   reverse1 *= -1
    // }
    // if (maxColor < hue1) {
    //   reverse1 *= -1
    // }
    //
    // if (hue2 < minColor) {
    //   reverse2 *= -1
    // }
    // if (maxColor < hue2) {
    //   reverse2 *= -1
    // }

    await bridge.setLightState('3', {hue: hue1})
    await bridge.setLightState('4', {hue: hue2})
    // await bridge.setLightState('4', {hue: (65535 - hue)})

    // await bridge.setLightState('3', {bri})
    // await bridge.setLightState('4', {bri: (254 - bri)})

    // console.log('hue', hue)
    // hue = Math.floor((hue + hueTimeStep) % 65535)
    // green 27
    // teal 33
    // hue = offset + Math.floor((hue + hueTimeStep) % (50000 - offset))



  }, timeStep)

})
