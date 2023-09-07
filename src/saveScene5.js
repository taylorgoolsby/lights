// @flow

import delay from 'delay'
import connect from './util/connect.js'

Promise.resolve().then(async () => {
  try {
    const bridge = await connect()

    const sceneId = '5'
    await bridge.saveCurrentScene(sceneId)
  } catch (err) {
    console.error(err)
  }
  await delay(1000)
})