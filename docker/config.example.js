// How many milliseconds of a single request does not respond after timeout (base value, if it times out continuously, next time it will be adjusted to twice the previous time)
const TIMEOUT_BASE = 7000
// The maximum timeout setting, such as a certain request, the first 7s timeout, the second 14s, the third 28s, the fourth 56s, the fifth time is not 112s but 60s, the same is true for subsequent
const TIMEOUT_MAX = 60000

const LOG_DELAY = 5000 // Log output interval, in milliseconds
const PAGE_SIZE = 1000 // Each network request reads the number of files in the directory, the larger the value, the more likely it will time out

const RETRY_LIMIT = 7 // If a request fails, the maximum number of retries allowed
const PARALLEL_LIMIT = 20 // The number of parallel network requests can be adjusted according to the network environment

const DEFAULT_TARGET = '' // Required, copy the default destination ID, if you do not specify the target, it will be copied here, it is recommended to fill in the team disk ID

const AUTH = { // If you have a json authorization file for the service account, you can copy it to the sa directory instead of client_id/secret/refrest_token
  client_id: 'your_client_id',
  client_secret: 'your_client_secret',
  refresh_token: 'your_refrest_token',
  expires: 0, // Can be left blank
  access_token: '', // Can be left blank
  tg_token: '', // For the token of your telegram robot, please refer to https://core.telegram.org/bots#6-botfather
  tg_whitelist: [''] // Your tg username(t.me/username), bot will only execute commands sent by users in this list
}

module.exports = { AUTH, PARALLEL_LIMIT, RETRY_LIMIT, TIMEOUT_BASE, TIMEOUT_MAX, LOG_DELAY, PAGE_SIZE, DEFAULT_TARGET }
