
import dotenvDefaults from "dotenv-defaults"
import path from 'path'
import env from 'parsenv'
import fs from 'fs'
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const envPath = path.resolve(__dirname, '../..', '.env')

// console.log(envPath)

function set(updateSet) {
  try {
    const {
      BRIDGE_USERNAME,
      BRIDGE_INTERNAL_IP,
      SCENE_DATA
    } = process.env
   
    env.edit({
      BRIDGE_USERNAME: BRIDGE_USERNAME || '',
      BRIDGE_INTERNAL_IP: BRIDGE_INTERNAL_IP || '',
      SCENE_DATA: SCENE_DATA || '',
      ...updateSet
    })
    env.write({path: envPath})
  } catch (err) {
    console.error(err)
  }
}


if (!fs.existsSync(envPath)) {
  // Create initial .env file.
  set({})
}
dotenvDefaults.config({
  path: envPath
})

// // Write defaults for missing ENV vars, if any:
set({})

export default {
  set,
  envPath
}