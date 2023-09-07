// @flow

import connect from './util/connect.js'
import delay from 'delay'

Promise.resolve().then(async () => {
  const bridge = await connect()

  const sceneId = '1'
  await bridge.loadScene(sceneId)
  await delay(1000)
})