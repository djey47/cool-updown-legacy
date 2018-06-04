const childProcess = require('child_process');

/*
 * Mockable system gateway for command line calls
 */

/**
 * ICMP Ping command wrapper
 * @returns Promise
 */
async function ping(host) {
  return new Promise((resolve) => {
    childProcess.exec(`ping -c 2 ${host}`, (err, stdout, stderr) => {
      const isPingSuccess = !err;
      if (isPingSuccess) {
        console.log(`ping: ${host}: Alive`);
        resolve(true);
      } else {
        console.log(`ping: ${host}: ${stderr}`);
        resolve(false);
      }
    });
  });
}

module.exports = {
  ping,
};
