import * as fs from 'fs';
import { NodeSSH } from 'node-ssh';
import { question } from 'readline-sync';
import { AppConfig } from './types';

const config: AppConfig = JSON.parse(fs.readFileSync('./app.json', 'utf-8'))
const ssh = new NodeSSH()

const main = async () => {

  try {

    console.log('✔ Connecting Server...')

    const password = question(`Please enter password (${config.server.username}@${config.server.host}): `, { hideEchoBack: true, mask: ''});

    try {
      await ssh.connect({
        host: config.server.host,
        port: config.server.port,
        username: config.server.username,
        password: password
      })
    } catch(e:any) {
      throw new Error('❌ Could not connect server')
    }

    console.log('✔ Deploying...')

    await ssh.putDirectory(config.distDir, config.server.deployTo)
    await ssh.putFile(config.distDir + '/.htaccess', config.server.deployTo + '/.htaccess')
    ssh.dispose();

    console.log('✔ Deploy succeeded')

  } catch(e:any) {
    console.log(e.message)
  }
}

main()