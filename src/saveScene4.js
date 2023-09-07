// @flow

import connect from './util/connect.js'
import delay from 'delay'

Promise.resolve().then(async () => {
  const bridge = await connect()

  const sceneId = '4'
  await bridge.saveCurrentScene(sceneId)
  await delay(1000)
})