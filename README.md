# cool-updown
NodeJS script to enable scheduled server start/stop. Runs as a HTTP server.

## Install

### Requirements
- *Client*:
  - LAN
  - NodeJS 8+
- *Remote server*:
  - LAN, SSH service running, WOL enabled
  - User with root privileges (sudoer)

### Steps
- Clone this repository with git or extract source archive to a directory
- Head to directory then type `npm install` or `yarn`, according to your preferences.

## Configure
Default configuration is given as example in `config/default.json` file.

```json
{
  "app": {
    "port": 4600,
    "authEnabled": false,
  },
  "server": {
    "macAddress": "FF:FF:FF:FF:FF:FF:FF:FF",
    "broadcastAddress": "255.255.255.255",
    "hostname": "myserver",
    "user": "bob",
    "password": "alice",
    "offCommand": "sudo -S shutdown -h 1",
    "sshPort": 22,
    "keyPath": "/home/user/.ssh/id_rsa"        
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
}
```

To override settings, create a `config/local.json` file and add changes to your liking.

Note: `config/local-test.json` is used for testing during development only!

### Available settings

| Setting | Description | Default value |
| ------- | ----------- | ------------- |
| `app.authEnabled`| `true` will perform basic HTTP authentication; using `server.user` and `server.password` settings below. `false` will allow public access | false (=disabled) |
| `app.port`| TCP port to be used by the service | 4600 |
| `server.broadcastAddress`| useful to fix wake on lan on Windows systems, eventually | 255.255.255.255 |
| `server.hostName`| name or IP address to join your server via SSH | myserver (**change it**) |
| `server.keyPath`| location of your private key to be used for SSH | /home/user/.ssh/id_rsa (**change it**) |
| `server.macAddress`| used to wake the server up | FF:FF:FF:FF:FF:FF:FF:FF (**change it**) |
| `server.offCommand`| any command used to shut the system down | sudo -S shutdown -h 1 |
| `server.password`| password for user above | alice (**change it**) |
| `server.sshPort`| TCP port to join your server via SSH | 22 |
| `server.user`| user name to join your server via SSH (sudoer) | bob (**change it**) |
| `schedule.enabled`| `true` will execute provided schedules, `false` won't | true (=enabled) |
| `schedule.on.at`, `schedule.off.at`| time as `HH:MM` (24hr format) when automatically triggering ON or OFF actions, respectively | 00:00, 01:00 (**change it**) |

### SSH Configuration

OFF command does require a correct communication via SSH; you should check both parts below:

#### Client side
- Get or generate RSA key pairs
- Connect manually at least once to server; to add it to known hosts.

#### Server side
- Allow public key authentication in SSH service parameters
- Add client public key in `.ssh/authorized_keys` file for the user you wanna connect with.

### Run
    npm start

or

    yarn start

Remember that application has to remain active for ON/OFF scheduling to work.

### Web-based usage

With your favourite web browser, head to http://machine:4600 (4600 being default port, can be changed in configuration).

Append to this URL value of `path` below.

#### Ping: displays status and configuration

Path: `/` (default)

Here is a sample output:
```
coolupdown alive and running!

{
  "app": {
    "port": 4600
  },
  "server": {
    "macAddress": "FF:FF:FF:FF:FF:FF:FF:FF",
    "broadcastAddress": "255.255.255.255",
    "hostname": "myserver",
    "user": "bob",
    "password": "********",
    "offCommand": "sudo -S shutdown -h 1"
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
}
```

#### ON: manually turns server ON

Path: `/on`

#### OFF: manually turns server OFF

Path: `/off`
