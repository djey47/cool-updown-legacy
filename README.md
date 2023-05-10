# cool-updown
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](http://choosealicense.com/licenses/mit)
![Build status](https://github.com/djey47/cool-updown/actions/workflows/node.js.yml/badge.svg?branch=master&event=push)

NodeJS script, written in Typescript, to enable scheduled server start/stop. Runs as a HTTP server.

It can manage one to many servers.

It also pings monitored server (ICMP, SSH, HTTP) and display result.

## Install

### Requirements
- *Client*:
  - Linux / Windows + WSL
  - LAN properly configured
  - NodeJS v18
  - Yarn (optionally)
- *Remote server*:
  - Linux
  - WOL enabled
  - LAN properly configured, SSH service running
  - User with root privileges (sudoer)

### Steps
- Clone this repository with git or extract source archive to a directory
- Head to directory then type `npm install` or `yarn`, according to your preferences; a 'ready to start' bundle will be generated automatically.

## Configure
Default configuration is given as example in `config/default.json` file.

```json
{
  "app": {
    "authEnabled": false,
    "port": 4600,
    "user": "bob",
    "password": "alice"
  },
  "servers": [{
    "url": "https://homepage",
    "network": {
      "macAddress": "FF:FF:FF:FF:FF:FF",
      "broadcastIpAddress": "255.255.255.255",
      "hostname": "myserver"
    },
    "ssh": {
      "offCommand": "sudo -S shutdown -h 1",
      "port": 22,
      "keyPath": "/home/user/.ssh/id_rsa",
      "user": "bob",
      "password": "alice"    
    },
    "schedule": {
      "enabled": true,
      "on": {
        "at": "00:00"
      },
      "off": {
        "at": "01:00"
      }
    }  
  }]
}
```

To override settings, create a `config/local.json` file and add changes to your liking.

Note: `config/local-test.json` is used for testing during development only!

### Available settings

| Setting | Description | Default value |
| ------- | ----------- | ------------- |
| `app` | Set of application config items as described below | {...} |
| `>> authEnabled`| `true` will perform basic HTTP authentication; using server.user` and `server.password` settings below. `false` will allow public` access | false (=disabled) |
| `>> port`| TCP port to be used by the service | 4600 |
| `servers` | Array of server config items as described below | [...] (=single server) |
| `>> url` | location to test server access via HTTP | http://localhost (**optional**) |
| `>> network` | Set of network related configuration as described below | {...} |
| `... macAddress`| used to wake the server up | FF:FF:FF:FF:FF:FF (**change it**) |
| `... broadcastIpAddress`| useful to fix wake on lan on Windows systems, eventually | 255.255.255.255 |
| `... hostName`| name or IP address to join your server via SSH | myserver and label it in ping page (**change it**) |
| `>> ssh` | Set of SSH access related configuration as described below | {...} |
| `... keyPath`| location of your private key to be used for SSH (PEM format, RSA only supported) | /home/user/.ssh/id_rsa (**change it**) |
| `... offCommand`| any command used to shut the system down | sudo -S shutdown -h 1 |
| `... user`| user name to join your server via SSH (sudoer) | bob (**change it**) |
| `... password`| password for user above | alice (**change it**) |
| `... port`| TCP port to join your server via SSH | 22 |
| `>> ssh` | Set of SSH access related configuration as described below | {...} |
| `... enabled`| `true` will execute provided schedules, `false` won't | true (=enabled) |
| `... on.at`, `off.at`| time as `HH:MM` (24hr format) when automatically triggering ON or OFF actions, respectively | 00:00, 01:00 (**change it**) |

### SSH Configuration

OFF command does require a working communication via SSH; you should check both parts below:

#### Client side (instance hosting cool-updown app)
- Get or generate RSA key pairs
- Connect manually at least once to server; to add it to known hosts.

#### Server side, for each of those to be managed
- Allow public key authentication in SSH service parameters
- Add client public key in `.ssh/authorized_keys` file for the user you wanna connect with.

### Run
Assuming install part above went well, and a `build/coolupdown.js` script has been generated:

simply execute `npm start` or `yarn start`.

Remember that application has to remain active for ON/OFF scheduling to work, so in target environment, you may want to use: `npm run start:service` or `yarn start:service` to run in background; you may also use [PM2](https://pm2.keymetrics.io/) to manage running it as a service (recommended).

For debugging purposes, commands are also available `npm run start:service-debug` or `yarn start:service-debug`: a `logs/debug.log` file will be created with all console output including fatal errors.

To stop application, hit CTRL+C when launched in foreground, otherwise `npm stop` or `yarn stop`.

#### Development notice

During development, application can run from typescript sources, without build phase, using `npm run start:dev` command.

While totally working, this is not recommended in production, especially under limited performance devices as Raspberry PIs.

#### Logs
In foreground execution, logs are written to both console and `logs/app.log` file.

While running in background, logs are written to above file only; to display 500 last logs events, following commands will help you: `npm run logs` or `yarn logs`.

Full logs will be displayed with `npm run logs:all` or `yarn logs:all` commands.

### Web-based usage

With your favourite web browser, head to URL: http://client.name.or.ip:4600 (4600 being default port, can be changed in configuration).

Append to this URL value of `path` below.

#### PING: displays status and configuration

Path: `/` (default)

Here is a sample page output:
```
coolupdown alive and running!

Running for less than one minute.

- Server #0: MY-SERVER

  - Schedule: ENABLED
  - Last start/stop attempt: N/A
  - Ping test: OK
  - SSH test: KO
  - HTTP test: KO URL

See logs for details.

Configuration
{...}
```

#### LOGS: display raw logs ####

Path: `/logs`

#### ON: manually turns server ON

Paths: 
- `/<id>/on` applies to a single server, where `<id>` is the server identifier (0-based index)
- `/on` applies to all the managed servers

#### OFF: manually turns server OFF

Paths: 
- `/<id>/off` applies to a single server, where `<id>` is the server identifier (0-based index)
- `/off` applies to all managed servers;

#### SCHEDULE ENABLE: automatically turns server ON/OFF at given hours

Path: `/enable`

#### SCHEDULE DISABLE: will stop turning server ON/OFF at given hours

Path: `/disable`
