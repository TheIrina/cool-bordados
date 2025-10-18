module.exports = {
  apps: [{
    name: 'medusa-cool-bordados',
    script: 'npm',
    args: 'start',
    cwd: './.medusa/server/',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
